import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isAuthRoutePath,
  isEmailAllowed,
  isPublicPath,
  loginErrorMessage,
  parseAllowedEmails,
  safeRedirectTarget,
} from "./policy.ts";

describe("auth policy", () => {
  it("treats only login and /auth/* as public", () => {
    assert.equal(isPublicPath("/login"), true);
    assert.equal(isPublicPath("/auth/callback"), true);
    assert.equal(isPublicPath("/auth/signout"), true);
    assert.equal(isPublicPath("/"), false);
    assert.equal(isPublicPath("/tasks/abc"), false);
    // 前方一致だけで通してしまわない
    assert.equal(isPublicPath("/logincheck"), false);
    assert.equal(isAuthRoutePath("/authorize"), false);
  });

  it("keeps redirect targets same-origin and out of the login loop", () => {
    assert.equal(safeRedirectTarget("/tasks/abc?x=1"), "/tasks/abc?x=1");
    assert.equal(safeRedirectTarget(null), "/");
    assert.equal(safeRedirectTarget(""), "/");
    assert.equal(safeRedirectTarget("https://evil.example.com"), "/");
    assert.equal(safeRedirectTarget("//evil.example.com"), "/");
    assert.equal(safeRedirectTarget("/\\evil.example.com"), "/");
    assert.equal(safeRedirectTarget("/login"), "/");
    assert.equal(safeRedirectTarget("/login?next=/x"), "/");
    assert.equal(safeRedirectTarget("/auth/callback"), "/");
  });

  it("parses the allowlist loosely and compares case-insensitively", () => {
    assert.deepEqual(parseAllowedEmails(undefined), []);
    assert.deepEqual(parseAllowedEmails("  "), []);
    assert.deepEqual(
      parseAllowedEmails("A@example.com, b@example.com\n c@example.com"),
      ["a@example.com", "b@example.com", "c@example.com"],
    );
  });

  it("allows anyone authenticated when the allowlist is empty", () => {
    assert.equal(isEmailAllowed("someone@example.com", []), true);
    assert.equal(isEmailAllowed(null, []), true);
  });

  it("blocks accounts outside a configured allowlist", () => {
    const allowed = parseAllowedEmails("tomy@example.com");
    assert.equal(isEmailAllowed("TOMY@example.com", allowed), true);
    assert.equal(isEmailAllowed("other@example.com", allowed), false);
    // 許可リストがあるのにメールが取れない場合は通さない
    assert.equal(isEmailAllowed(undefined, allowed), false);
  });

  it("maps error codes to japanese messages", () => {
    assert.equal(loginErrorMessage(null), null);
    assert.equal(loginErrorMessage("not_allowed"), "このアカウントは許可されていない。");
    assert.equal(loginErrorMessage("who_knows"), "ログインに失敗した。");
  });
});
