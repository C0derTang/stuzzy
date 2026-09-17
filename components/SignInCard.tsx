import { LogoMark } from "@/components/Logo";
import { GoogleButton } from "@/components/GoogleButton";

export type SignInCardProps = {
  /** The account that just tried to sign in was not a @stanford.edu Google account. */
  denied?: boolean;
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

export function SignInCard({ denied }: SignInCardProps) {
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
        {denied && (
          <p
            role="alert"
            className="w-full rounded-xl border border-accent/25 bg-accent/10 px-3.5 py-2.5 text-left text-[13px] leading-snug"
          >
            That account isn&rsquo;t a @stanford.edu address. Try again with your Stanford Google account.
          </p>
        )}
        <GoogleButton />
        <p className="text-xs text-muted">Stanford accounts only (@stanford.edu)</p>
      </div>
    </main>
  );
}
