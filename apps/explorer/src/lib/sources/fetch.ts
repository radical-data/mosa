import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { BlockList, isIP } from "node:net";
import { type DefaultTreeAdapterMap, parse } from "parse5";

export class CaptureFailure extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
const denied = new BlockList();
for (const [ip, bits] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  denied.addSubnet(ip, bits);
const global6 = new BlockList();
global6.addSubnet("2000::", 3, "ipv6");
const denied6 = new BlockList();
for (const [ip, bits] of [
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3fff::", 20],
] as const)
  denied6.addSubnet(ip, bits, "ipv6");
export function publicAddress(address: string): boolean {
  return isIP(address) === 4
    ? !denied.check(address)
    : isIP(address) === 6 && global6.check(address, "ipv6") && !denied6.check(address, "ipv6");
}
export function publicUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new CaptureFailure("blocked_access", "Enter a complete public HTTP or HTTPS URL.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.port ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    (isIP(host) && !publicAddress(host))
  )
    throw new CaptureFailure(
      "blocked_access",
      "Only public web destinations on standard ports are supported.",
    );
  url.hash = "";
  return url;
}
export interface WebResponse {
  status: number;
  headers: Record<string, string>;
  bytes: Uint8Array;
}
export type Resolve = (host: string) => Promise<{ address: string; family: number }[]>;
export type Transport = (
  url: URL,
  address: { address: string; family: number },
  signal: AbortSignal,
) => Promise<WebResponse>;
export const requestPinned: Transport = (url, address, signal) =>
  new Promise((resolve, reject) => {
    const req = (url.protocol === "https:" ? httpsRequest : httpRequest)(
      url,
      {
        signal,
        agent: false,
        family: address.family,
        lookup: (_hostname, _options, cb) => cb(null, address.address, address.family),
        headers: {
          "user-agent": "MosaResearch/1.0",
          accept: "text/html, application/json",
          "accept-encoding": "identity",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 2_000_000)
            req.destroy(
              new CaptureFailure("parsing_failure", "Source exceeds the 2 MB capture limit."),
            );
          else chunks.push(chunk);
        });
        res.on("error", reject);
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            headers: Object.fromEntries(
              Object.entries(res.headers).map(([k, v]) => [k, String(v ?? "")]),
            ),
            bytes: Buffer.concat(chunks),
          }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });
export function readable(bytes: Uint8Array, contentType: string): string {
  if (bytes.length > 2_000_000)
    throw new CaptureFailure("parsing_failure", "Source exceeds capture limit.");
  const charset = contentType.match(/charset=["']?([^;"' ]+)/i)?.[1] ?? "utf-8";
  let text: string;
  try {
    text = new TextDecoder(charset, { fatal: true }).decode(bytes);
  } catch {
    throw new CaptureFailure("parsing_failure", "Unsupported or invalid text encoding.");
  }
  let result: string;
  if (contentType.startsWith("application/json")) {
    try {
      result = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      throw new CaptureFailure("parsing_failure", "Invalid JSON response.");
    }
  } else if (contentType.startsWith("text/html")) {
    const walk = (node: DefaultTreeAdapterMap["node"]): string => {
      if (
        "tagName" in node &&
        (["script", "style", "template", "noscript", "svg", "head"].includes(node.tagName) ||
          node.attrs.some(
            (a) => a.name === "hidden" || (a.name === "type" && a.value === "password"),
          ))
      )
        return "";
      if ("value" in node) return node.value;
      return "childNodes" in node ? node.childNodes.map(walk).join(" ") : "";
    };
    if (/type\s*=\s*["']password["']/i.test(text))
      throw new CaptureFailure(
        "blocked_access",
        "A sign-in page is not a usable catalogue capture.",
      );
    result = walk(parse(text)).replace(/\s+/g, " ").trim();
  } else
    throw new CaptureFailure(
      "parsing_failure",
      "Only HTML and JSON catalogue responses are supported.",
    );
  if (
    /verify you are human|checking your browser|enable javascript and cookies|access denied|captcha/i.test(
      result,
    )
  )
    throw new CaptureFailure("blocked_access", "The site returned an access challenge.");
  if (result.length < 40 || result.length > 200_000)
    throw new CaptureFailure(
      "parsing_failure",
      "The readable source is empty, too short, or exceeds 200,000 characters.",
    );
  return result;
}
export async function captureUrl(
  value: string,
  resolve: Resolve = (host) => lookup(host, { all: true }),
  transport: Transport = requestPinned,
) {
  const signal = AbortSignal.timeout(30_000);
  let url = publicUrl(value);
  const redirects: string[] = [];
  for (let n = 0; n <= 4; n++) {
    signal.throwIfAborted();
    const host = url.hostname.replace(/^\[|\]$/g, "");
    const addresses = await Promise.race([
      resolve(host),
      new Promise<never>((_, reject) =>
        signal.addEventListener(
          "abort",
          () => reject(new CaptureFailure("blocked_access", "Capture timed out.")),
          { once: true },
        ),
      ),
    ]);
    if (!addresses.length || addresses.some((a) => !publicAddress(a.address)))
      throw new CaptureFailure("blocked_access", "Destination resolves to a non-public network.");
    const response = await transport(url, addresses[0], signal);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (!response.headers.location)
        throw new CaptureFailure("blocked_access", "Redirect has no destination.");
      redirects.push(url.href);
      url = publicUrl(new URL(response.headers.location, url).href);
      continue;
    }
    if (response.status !== 200)
      throw new CaptureFailure("blocked_access", `Catalogue returned HTTP ${response.status}.`);
    if (response.headers["content-encoding"] && response.headers["content-encoding"] !== "identity")
      throw new CaptureFailure("parsing_failure", "Compressed response was not requested.");
    const contentType = response.headers["content-type"] ?? "";
    return {
      bytes: response.bytes,
      mediaType: contentType.split(";")[0],
      text: readable(response.bytes, contentType),
      manifest: {
        requestedUrl: value,
        finalUrl: url.href,
        redirects,
        status: response.status,
        retrievedAt: new Date().toISOString(),
        contentType,
        etag: response.headers.etag || null,
        lastModified: response.headers["last-modified"] || null,
        extractor: "mosa-readable-v1",
      },
    };
  }
  throw new CaptureFailure("blocked_access", "Too many redirects.");
}
export type CaptureResult = Awaited<ReturnType<typeof captureUrl>>;
