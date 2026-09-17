import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

// Google sends people back here; Clerk finishes the sign-in (or first-time sign-up) and goes to "/".
export default function SsoCallback() {
  return (
    <main className="flex min-h-full items-center justify-center p-6 text-sm text-muted">
      Signing you in…
      {/* Clerk mounts its bot-protection widget here when a first-time sign-up needs it. */}
      <div id="clerk-captcha" />
      <AuthenticateWithRedirectCallback signInUrl="/" signUpUrl="/" />
    </main>
  );
}
