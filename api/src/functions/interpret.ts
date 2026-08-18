import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

import {
  modelInterpretationJsonSchema,
  validateModelInterpretation,
} from "../command.js";

const DEFAULT_MODEL = "gpt-5.4-nano";
const MAX_TEXT_LENGTH = 500;

interface OpenAIResponse {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
  }>;
}

function errorResponse(status: number, error: string): HttpResponseInit {
  return { status, jsonBody: { error } };
}

export async function interpret(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Request body must be valid JSON.");
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("text" in body) ||
    typeof body.text !== "string"
  ) {
    return errorResponse(400, "Request body must contain a text string.");
  }

  const text = body.text.trim();
  if (text.length === 0 || text.length > MAX_TEXT_LENGTH) {
    return errorResponse(400, `Text must contain between 1 and ${MAX_TEXT_LENGTH} characters.`);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    context.error("OPENAI_API_KEY is not configured.");
    return errorResponse(500, "OpenAI API access is not configured.");
  }

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_INTERPRET_MODEL ?? DEFAULT_MODEL,
        instructions:
          "Classify one Hungarian teacher utterance. Set intent to add_grade only for an explicit " +
          "request to ADD one grade from 1 to 5 to one student. Set intent to unsupported for every " +
          "other operation, including removing, deleting, changing, multiplying, or dividing a " +
          "grade or student. The sentences 'Vegyél el egy 5-öst az 5. osztály 6-os számú " +
          "tanulójától' and 'Szorozd meg az 5. osztály 6-os tanulóját 5-tel' are " +
          "unsupported_intent. Fractional or slash-separated grades such as 4/5 are also " +
          "unsupported_intent, never grade 4 or grade 5. Never reinterpret an unsupported " +
          "operation as add_grade and never invent missing information. Use null for omitted " +
          "class, identifier, name, or grade. " +
          "Use missing_information when an add-grade request lacks a grade or both student " +
          "identifier and name; use ambiguous_command when its meaning is unclear. For add_grade, " +
          "rejectionReason must be null. Normalize a spoken numeric student identifier to digits " +
          "only: for example, 'hetes számú tanuló' becomes '7'.",
        input: text,
        text: {
          format: {
            type: "json_schema",
            name: "grade_command_interpretation",
            strict: true,
            schema: modelInterpretationJsonSchema,
          },
        },
        max_output_tokens: 200,
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    context.error("OpenAI API request failed.", error);
    return errorResponse(502, "OpenAI API request failed.");
  }

  if (!response.ok) {
    context.error(`OpenAI API returned HTTP ${response.status}.`);
    return errorResponse(502, "OpenAI API request failed.");
  }

  const result = (await response.json()) as OpenAIResponse;
  const content = result.output?.flatMap((item) => item.content ?? []) ?? [];
  const outputText = content.find((item) => item.type === "output_text")?.text;

  if (!outputText || content.some((item) => item.type === "refusal")) {
    return errorResponse(422, "The command could not be interpreted safely.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    return errorResponse(502, "OpenAI returned malformed structured output.");
  }

  const interpretation = validateModelInterpretation(parsed);
  if (!interpretation) {
    return errorResponse(422, "OpenAI returned an invalid interpretation.");
  }

  return { status: 200, jsonBody: interpretation };
}

app.http("interpret", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "interpret",
  handler: interpret,
});
