import { spawn } from "node:child_process";

export interface RunCommandOptions {
  cwd?: string;
  captureOutput?: boolean;
  env?: NodeJS.ProcessEnv;
  signal?: AbortSignal;
}

export class CommandError extends Error {
  readonly command: string;
  readonly exitCode: number | null;
  readonly stderr: string;

  constructor(command: string, exitCode: number | null, stderr: string) {
    const suffix = stderr.trim() ? `\n${stderr.trim()}` : "";
    super(`Command failed (${exitCode ?? "unknown"}): ${command}${suffix}`);
    this.name = "CommandError";
    this.command = command;
    this.exitCode = exitCode;
    this.stderr = stderr;
  }
}

export async function runCommand(
  executable: string,
  args: readonly string[],
  options: RunCommandOptions = {},
): Promise<string> {
  const displayCommand = [executable, ...args].join(" ");
  const captureOutput = options.captureOutput ?? false;

  return await new Promise<string>((resolve, reject) => {
    options.signal?.throwIfAborted();
    const child = spawn(executable, [...args], {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...options.env,
      },
      shell: false,
      detached: !!options.signal && process.platform !== "win32",
      stdio: captureOutput ? ["ignore", "pipe", "pipe"] : "inherit",
    });

    const abort = () => {
      if (!child.pid) return;
      try {
        if (process.platform === "win32") child.kill("SIGTERM");
        else process.kill(-child.pid, "SIGTERM");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
      }
    };
    options.signal?.addEventListener("abort", abort, { once: true });
    const removeAbort = () => options.signal?.removeEventListener("abort", abort);
    if (options.signal?.aborted) abort();

    let stdout = "";
    let stderr = "";

    if (captureOutput) {
      child.stdout?.setEncoding("utf8");
      child.stderr?.setEncoding("utf8");
      child.stdout?.on("data", (chunk: string) => {
        stdout += chunk;
      });
      child.stderr?.on("data", (chunk: string) => {
        stderr += chunk;
      });
    }

    child.once("error", (error) => {
      removeAbort();
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        reject(
          new Error(
            `Unable to run ${executable}. Ensure project dependencies are installed and the command is available on PATH.`,
          ),
        );
        return;
      }

      reject(error);
    });

    child.once("close", (exitCode) => {
      removeAbort();
      if (options.signal?.aborted) {
        reject(new Error(`Verification interrupted: ${executable}`));
        return;
      }
      if (exitCode === 0) {
        resolve(stdout.trim());
        return;
      }

      reject(new CommandError(displayCommand, exitCode, stderr));
    });
  });
}
