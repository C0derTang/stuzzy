type ExternalAccount = {
  provider: string;
  emailAddress: string;
  verification: { status: string } | null;
};

/** Stanford-only gate: the user must have signed in through a verified Google account at exactly @stanford.edu. */
export function stanfordEmail(user: { externalAccounts: ExternalAccount[] } | null | undefined): string | null {
  const account = user?.externalAccounts.find(
    (a) =>
      a.provider === "oauth_google" &&
      a.verification?.status === "verified" &&
      a.emailAddress.toLowerCase().endsWith("@stanford.edu"),
  );
  return account ? account.emailAddress.toLowerCase() : null;
}
