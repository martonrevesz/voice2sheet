import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { google } from "googleapis";

const SHEETS_READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

function requiredSetting(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
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
    const auth = new google.auth.GoogleAuth({ scopes: [SHEETS_READONLY_SCOPE] });
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
