import type { APIRoute } from "astro";
import { authRequest } from "../../lib/capture/access";
export const POST: APIRoute = async (context) => {
  const token = context.cookies.get("mosa-research")?.value;
  if (token) await authRequest("logout", {}, token);
  context.cookies.delete("mosa-research", { path: "/research" });
  return context.redirect("/research/sign-in", 303);
};
