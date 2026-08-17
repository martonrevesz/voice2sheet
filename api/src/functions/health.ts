import { app, HttpResponseInit } from "@azure/functions";

export async function health(): Promise<HttpResponseInit> {
  return {
    status: 200,
    jsonBody: { status: "ok" },
  };
}

app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health",
  handler: health,
});
