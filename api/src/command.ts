export interface AddGradeCommand {
  schemaVersion: "1.0";
  intent: "add_grade";
  student: {
    class: string | null;
    identifier: string | null;
    name: string | null;
  };
  grade: 1 | 2 | 3 | 4 | 5;
}

export const commandJsonSchema = {
  type: "object",
  properties: {
    schemaVersion: { type: "string", const: "1.0" },
    intent: { type: "string", const: "add_grade" },
    student: {
      type: "object",
      properties: {
        class: { type: ["string", "null"] },
        identifier: {
          anyOf: [
            { type: "string", pattern: "^[0-9]+$" },
            { type: "null" },
          ],
          description: "Student identifier normalized to digits only, for example 7.",
        },
        name: { type: ["string", "null"] },
      },
      required: ["class", "identifier", "name"],
      additionalProperties: false,
    },
    grade: { type: "integer", enum: [1, 2, 3, 4, 5] },
  },
  required: ["schemaVersion", "intent", "student", "grade"],
  additionalProperties: false,
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && actualKeys.every((key) => keys.includes(key));
}

function isNullableText(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && value.trim().length > 0);
}

function isNullableIdentifier(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && /^[0-9]+$/.test(value));
}

export function validateCommand(value: unknown): AddGradeCommand | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["schemaVersion", "intent", "student", "grade"])) {
    return null;
  }

  if (value.schemaVersion !== "1.0" || value.intent !== "add_grade") {
    return null;
  }

  if (!Number.isInteger(value.grade) || ![1, 2, 3, 4, 5].includes(value.grade as number)) {
    return null;
  }

  const student = value.student;
  if (!isRecord(student) || !hasOnlyKeys(student, ["class", "identifier", "name"])) {
    return null;
  }

  if (
    !isNullableText(student.class) ||
    !isNullableIdentifier(student.identifier) ||
    !isNullableText(student.name) ||
    (student.identifier === null && student.name === null)
  ) {
    return null;
  }

  return value as unknown as AddGradeCommand;
}
