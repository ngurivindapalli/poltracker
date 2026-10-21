/**
 * Launch-readiness tests for comments, ads config, and auth helpers.
 * Run: npm run test:launch
 */
import assert from "assert";
import {
  sanitizeCommentBody,
  validateCommentBody,
  validateEntityKey,
} from "../src/lib/comments/validation";
import { MAX_COMMENT_LENGTH } from "../src/lib/comments/constants";
import {
  allowCommentWrite,
  resetCommentRateLimit,
} from "../src/lib/comments/rateLimit";
import { adsTxtBody, getAdsenseClient, getAdsenseSlot } from "../src/lib/ads/config";
import { googleCallbackUrl } from "../src/lib/auth/env";
import { COMMENT_RATE_LIMIT_MAX } from "../src/lib/comments/constants";

function testCommentValidation() {
  assert.strictEqual(validateCommentBody(""), "Comment cannot be empty.");
  assert.strictEqual(validateCommentBody("   "), "Comment cannot be empty.");
  assert.strictEqual(validateCommentBody("Hello"), null);
  assert.ok(
    validateCommentBody("x".repeat(MAX_COMMENT_LENGTH + 1))?.includes("characters")
  );
  assert.strictEqual(sanitizeCommentBody("  hello  "), "hello");
}

function testEntityKeys() {
  assert.strictEqual(validateEntityKey("politician", "Discussion"), null);
  assert.strictEqual(validateEntityKey("S001150", "Discussion"), null);
  assert.ok(validateEntityKey("", "Discussion"));
  assert.ok(validateEntityKey("bad key", "Discussion"));
  assert.ok(validateEntityKey("<script>", "Discussion"));
}

function testRateLimit() {
  resetCommentRateLimit();
  for (let i = 0; i < COMMENT_RATE_LIMIT_MAX; i += 1) {
    assert.strictEqual(allowCommentWrite("user-1"), true);
  }
  assert.strictEqual(allowCommentWrite("user-1"), false);
  assert.strictEqual(allowCommentWrite("user-2"), true);
}

function testAdsRejectInvalidIds() {
  const previousClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const previousHome = process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME;
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT = "not-a-publisher";
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME = "abc";
  assert.strictEqual(getAdsenseClient(), null);
  assert.strictEqual(getAdsenseSlot("HOME"), null);
  assert.strictEqual(adsTxtBody(), null);

  process.env.NEXT_PUBLIC_ADSENSE_CLIENT = "ca-pub-1234567890123456";
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME = "1234567890";
  assert.strictEqual(getAdsenseClient(), "ca-pub-1234567890123456");
  assert.ok(adsTxtBody()?.includes("pub-1234567890123456"));

  if (previousClient === undefined) delete process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  else process.env.NEXT_PUBLIC_ADSENSE_CLIENT = previousClient;
  if (previousHome === undefined) delete process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME;
  else process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME = previousHome;
}

function testCallbackUrl() {
  assert.strictEqual(
    googleCallbackUrl("https://politeia.co"),
    "https://politeia.co/api/auth/callback/google"
  );
}

function run() {
  testCommentValidation();
  testEntityKeys();
  testRateLimit();
  testAdsRejectInvalidIds();
  testCallbackUrl();
  console.log("test-launch-readiness: ok");
}

run();
