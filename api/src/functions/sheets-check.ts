import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { google } from "googleapis";

const SHEETS_READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

function requiredSetting(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

export function decodeServiceAccountCredentials(encoded: string): ServiceAccountCredentials {
  const parsed: unknown = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("client_email" in parsed) ||
    typeof parsed.client_email !== "string" ||
    parsed.client_email.trim().length === 0 ||
    !("private_key" in parsed) ||
    typeof parsed.private_key !== "string" ||
    !parsed.private_key.includes("BEGIN PRIVATE KEY")
  ) {
    throw new Error("Invalid service-account credentials.");
  }

  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key,
  };
}

function createGoogleAuth(): InstanceType<typeof google.auth.GoogleAuth> {
  const encodedCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64?.trim();

  return new google.auth.GoogleAuth({
    ...(encodedCredentials
      ? { credentials: decodeServiceAccountCredentials(encodedCredentials) }
      : {}),
    scopes: [SHEETS_READONLY_SCOPE],
  });
}

export async function sheetsCheck(
  _request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const spreadsheetId = requiredSetting("GOOGLE_SPREADSHEET_ID");
  const range = requiredSetting("GOOGLE_TEST_RANGE");
  const expectedValue = requiredSetting("GOOGLE_TEST_EXPECTED_VALUE");

  if (!spreadsheetId || !range || !expectedValue) {
    context.error("Google Sheets check settings are incomplete.");
    return {
      status: 500,
      jsonBody: { error: "Google Sheets access is not configured." },
    };
  }

  try {
    const auth = createGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const actualValue = response.data.values?.[0]?.[0];

    if (actualValue !== expectedValue) {
      context.error("Google Sheets check returned an unexpected value.");
      return {
        status: 502,
        jsonBody: {
          error: "Google Sheets returned an unexpected value.",
          range,
        },
      };
    }

    return {
      status: 200,
      jsonBody: { status: "ok", range, value: actualValue },
    };
  } catch (error) {
    context.error("Google Sheets read failed.", error);
    return {
      status: 502,
      jsonBody: { error: "Google Sheets read failed." },
    };
  }
}

app.http("sheets-check", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "sheets-check",
  handler: sheetsCheck,
});
