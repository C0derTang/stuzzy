"use client";

import { HandleSSOCallback } from "@clerk/nextjs";

// Google sends people back here. Clerk finishes the sign-in (or first-time sign-up, including its
// bot-protection captcha) and then goes home. Full page loads so the server sees the new session.
export default function SsoCallback() {
  const home = () => window.location.assign("/");
  return (
    <main className="flex min-h-full items-center justify-center p-6 text-sm text-muted">
      Signing you in…
      <HandleSSOCallback
        navigateToApp={({ decorateUrl }) => window.location.assign(decorateUrl("/"))}
        navigateToSignIn={home}
        navigateToSignUp={home}
      />
    </main>
  );
}
