import { LogoMark } from "@/components/Logo";
import { signInWithGoogle } from "@/lib/actions";

export type SignInCardProps = {
  /** Auth.js error code from `/?error=...`, e.g. "AccessDenied" for non-Stanford accounts. */
  error?: string;
};

// Decorative week: 7 day columns × 4 rows. 9 = everyone free.
const MOTIF = [
  [0, 1, 0, 2, 1, 0, 0],
  [1, 2, 1, 9, 2, 1, 0],
  [0, 2, 3, 9, 3, 1, 1],
  [0, 1, 1, 2, 1, 0, 0],
];

function Motif() {
  return (
    <div aria-hidden className="grid grid-cols-7 gap-1">
      {MOTIF.flat().map((level, i) => (
        <span
          key={i}
          className="h-2.5 w-5 rounded-[4px]"
          style={
            level === 9
              ? { background: "var(--accent)", boxShadow: "0 0 10px rgb(var(--accent-rgb) / 0.5)" }
              : { background: `rgb(var(--heat-rgb) / ${0.07 + level * 0.15})` }
          }
        />
      ))}
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

export function SignInCard({ error }: SignInCardProps) {
  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <div className="glass flex w-full max-w-sm flex-col items-center gap-6 px-8 py-10 text-center">
        <Motif />
        <div className="flex flex-col items-center gap-2">
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
            <LogoMark size={24} />
            stuzzy
          </h1>
          <p className="text-[15px] text-muted">See when everyone&rsquo;s free.</p>
        </div>
        {error && (
          <p
            role="alert"
            className="w-full rounded-xl border border-accent/25 bg-accent/10 px-3.5 py-2.5 text-left text-[13px] leading-snug"
          >
            {error === "AccessDenied"
              ? "That account isn't a @stanford.edu address. Try again with your Stanford Google account."
              : "Sign-in didn't work. Please try again."}
          </p>
        )}
        <form action={signInWithGoogle} className="w-full">
          <button type="submit" className="btn h-11 w-full text-sm">
            <GoogleLogo />
            Continue with Google
          </button>
        </form>
        <p className="text-xs text-muted">Stanford accounts only (@stanford.edu)</p>
      </div>
    </main>
  );
}
