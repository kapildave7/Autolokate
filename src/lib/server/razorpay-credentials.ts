/**
 * Razorpay Key ID always starts with rzp_test_ or rzp_live_; the secret does not.
 * Env values are often swapped — detect and correct.
 */
export function getRazorpayCredentials():
  | { ok: true; keyId: string; keySecret: string }
  | { ok: false; reason: "missing" } {
  let keyId = process.env.RAZORPAY_KEY_ID?.trim() ?? "";
  let keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() ?? "";

  if (!keyId || !keySecret) {
    return { ok: false, reason: "missing" };
  }

  const looksLikeKeyId = (s: string) => s.startsWith("rzp_test_") || s.startsWith("rzp_live_");

  if (!looksLikeKeyId(keyId) && looksLikeKeyId(keySecret)) {
    [keyId, keySecret] = [keySecret, keyId];
  }

  return { ok: true, keyId, keySecret };
}
