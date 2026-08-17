import assert from "node:assert/strict";
import test from "node:test";

import { validateCommand } from "../command.js";

const validCommand = {
  schemaVersion: "1.0",
  intent: "add_grade",
  student: { class: "5.A", identifier: "6", name: null },
  grade: 5,
};

test("accepts a valid add_grade command", () => {
  assert.deepEqual(validateCommand(validCommand), validCommand);
});

test("rejects an invalid grade", () => {
  assert.equal(validateCommand({ ...validCommand, grade: 6 }), null);
});

test("rejects a command without a student identifier or name", () => {
  assert.equal(
    validateCommand({
      ...validCommand,
      student: { class: "5.A", identifier: null, name: null },
    }),
    null,
  );
});

test("rejects a non-normalized student identifier", () => {
  assert.equal(
    validateCommand({
      ...validCommand,
      student: { class: "5.C", identifier: "hetes számú tanuló", name: null },
    }),
    null,
  );
});

test("rejects unexpected model output fields", () => {
  assert.equal(validateCommand({ ...validCommand, row: 6 }), null);
});
