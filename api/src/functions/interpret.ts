import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

import { commandJsonSchema, validateCommand } from "../command.js";

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
          "Extract one Hungarian teacher grade command. Never invent missing information. " +
          "Use null for an omitted class, identifier, or name. If the grade or both student " +
          "identifier and name are missing, refuse instead of guessing. Normalize a spoken " +
          "numeric student identifier to digits only: for example, 'hetes számú tanuló' becomes '7'.",
        input: text,
        text: {
          format: {
            type: "json_schema",
            name: "add_grade_command",
            strict: true,
            schema: commandJsonSchema,
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

  const command = validateCommand(parsed);
  if (!command) {
    return errorResponse(422, "OpenAI returned an invalid command.");
  }

  return { status: 200, jsonBody: command };
}

app.http("interpret", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "interpret",
  handler: interpret,
});
