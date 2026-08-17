const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error(
    "OPENAI_API_KEY is not set. Set it in this terminal, then run npm run test:openai again.",
  );
  process.exit(1);
}

const response = await fetch("https://api.openai.com/v1/responses", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "gpt-5.4-nano",
    input: "Reply with exactly: Voice2Sheet API connection works",
    max_output_tokens: 20,
  }),
});

if (!response.ok) {
  const error = await response.json().catch(() => null);
  const message = error?.error?.message ?? `${response.status} ${response.statusText}`;
  console.error(`OpenAI API request failed: ${message}`);
  process.exit(1);
}

const result = await response.json();
const outputText = result.output
  ?.flatMap((item) => item.content ?? [])
  .find((item) => item.type === "output_text")
  ?.text;

if (!outputText) {
  console.error("OpenAI API returned no text output.");
  process.exit(1);
}

console.log(outputText.trim());
