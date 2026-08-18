import assert from "node:assert/strict";
import test from "node:test";

import { decodeServiceAccountCredentials } from "../functions/sheets-check.js";

test("decodes the required service-account credential fields", () => {
  const encoded = Buffer.from(
    JSON.stringify({
      type: "service_account",
      client_email: "voice2sheet@example.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n",
      ignored: "field",
    }),
  ).toString("base64");

  assert.deepEqual(decodeServiceAccountCredentials(encoded), {
    client_email: "voice2sheet@example.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n",
  });
});

test("rejects malformed service-account credentials", () => {
  const encoded = Buffer.from(JSON.stringify({ client_email: "missing-key@example.com" })).toString(
    "base64",
  );

  assert.throws(() => decodeServiceAccountCredentials(encoded), {
    message: "Invalid service-account credentials.",
  });
});
