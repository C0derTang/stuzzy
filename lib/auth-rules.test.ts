import { describe, expect, it } from "vitest";
import { isStanfordProfile } from "./auth-rules";

const ok = { email: "x@stanford.edu", email_verified: true, hd: "stanford.edu" };

describe("isStanfordProfile", () => {
  it("accepts a verified stanford.edu account", () => {
    expect(isStanfordProfile(ok)).toBe(true);
    expect(isStanfordProfile({ ...ok, email: "X@Stanford.EDU" })).toBe(true);
  });

  it.each([
    ["gmail", { ...ok, email: "x@gmail.com" }],
    ["subdomain", { ...ok, email: "x@cs.stanford.edu" }],
    ["suffix spoof", { ...ok, email: "x@stanford.edu.evil.com" }],
    ["unverified email", { ...ok, email_verified: false }],
    ["truthy but not true email_verified", { ...ok, email_verified: "true" }],
    ["missing hd", { email: ok.email, email_verified: true }],
    ["mismatched hd", { ...ok, hd: "gmail.com" }],
    ["subdomain hd", { ...ok, hd: "cs.stanford.edu" }],
    ["missing email", { email_verified: true, hd: "stanford.edu" }],
    ["no profile", undefined],
  ])("rejects %s", (_, profile) => {
    expect(isStanfordProfile(profile)).toBe(false);
  });
});
