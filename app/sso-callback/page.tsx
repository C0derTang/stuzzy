import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

// Google sends people back here; Clerk finishes the sign-in (or first-time sign-up) and goes to "/".
export default function SsoCallback() {
  return <AuthenticateWithRedirectCallback />;
}
