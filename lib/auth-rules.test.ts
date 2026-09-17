import { describe, expect, it } from "vitest";
import { stanfordEmail } from "./auth-rules";

const google = (emailAddress: string, status = "verified", provider = "oauth_google") => ({
  externalAccounts: [{ provider, emailAddress, verification: { status } }],
});

describe("stanfordEmail", () => {
  it("accepts a verified Google account at stanford.edu", () => {
    expect(stanfordEmail(google("x@stanford.edu"))).toBe("x@stanford.edu");
    expect(stanfordEmail(google("X@Stanford.EDU"))).toBe("x@stanford.edu");
  });

  it.each([
    ["other domain", google("x@gmail.com")],
    ["subdomain", google("x@cs.stanford.edu")],
    ["lookalike domain", google("x@stanford.edu.evil.com")],
    ["lookalike prefix", google("x@notstanford.edu")],
    ["unverified", google("x@stanford.edu", "unverified")],
    ["not Google", google("x@stanford.edu", "verified", "oauth_github")],
    ["no verification", { externalAccounts: [{ provider: "oauth_google", emailAddress: "x@stanford.edu", verification: null }] }],
    ["no external accounts", { externalAccounts: [] }],
    ["no user", null],
  ])("rejects %s", (_name, user) => {
    expect(stanfordEmail(user)).toBeNull();
  });
});
