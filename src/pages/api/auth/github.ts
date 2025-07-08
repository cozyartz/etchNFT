import { githubAuth } from "../../../lib/auth";
import { generateState } from "arctic";

export const GET = async ({ cookies, redirect }) => {
  const state = generateState();
  const url = await githubAuth.createAuthorizationURL(state);

  // Set the state in a cookie for verification
  cookies.set("github_oauth_state", state, {
    path: "/",
    secure: import.meta.env.MODE === "production",
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax",
  });

  return redirect(url.toString());
};
