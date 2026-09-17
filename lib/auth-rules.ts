type GoogleClaims = { email?: unknown; email_verified?: unknown; hd?: unknown };

/** `hd` in the authorization URL is only a picker hint, so the ID token claims are checked here. */
export function isStanfordProfile(profile: GoogleClaims | null | undefined): boolean {
  if (!profile) return false;
  return (
    profile.email_verified === true &&
    profile.hd === "stanford.edu" &&
    typeof profile.email === "string" &&
    profile.email.toLowerCase().endsWith("@stanford.edu")
  );
}
