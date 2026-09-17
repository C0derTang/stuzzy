export type SignInCardProps = {
  /** Auth.js error code from `/?error=...`, e.g. "AccessDenied" for non-Stanford accounts. */
  error?: string;
};

// STUB (Agent C).
export function SignInCard({ error }: SignInCardProps) {
  return <main>{error ?? "Sign in"}</main>;
}
