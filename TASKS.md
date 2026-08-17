# Voice2Sheet task plan

This file turns the product specification in project.md into a step-by-step execution plan.

## Operating rule

- Work only one milestone at a time.
- Keep each milestone small and demonstrably testable.
- Run the relevant automated checks at the end of each milestone.
- Stop after acceptance criteria are met and wait for explicit user confirmation before starting the next milestone.
- Do not write production code outside the current milestone.

---

## Milestone 0 — Verify local development environment

Goal: confirm the required tools are present before starting implementation.

Tasks:
- Check Git availability and version.
- Check Node.js and npm availability and version.
- Check VS Code availability.
- Check whether Azure Functions tooling is installed if needed for the chosen workflow.
- Check whether Azure CLI is available if deployment will use it.
- Record missing prerequisites and decide whether any are required for the upcoming milestone.

Acceptance:
- The agent reports detected versions and identifies any missing prerequisite.
- Stop here and wait for approval before continuing.

---

## Milestone 1 — OpenAI API setup

Status: **Completed**

Goal: enable backend AI access using a project API key and a harmless local validation request.

Tasks:
- Guide the user through the current official OpenAI setup flow.
- Confirm or create the correct API project.
- Ensure billing is enabled if required.
- Set a conservative spending limit when available.
- Create an API key.
- Store the key locally as an environment variable such as OPENAI_API_KEY.
- Test a minimal backend script or function making one harmless request.

Acceptance:
- [x] The minimal local backend call succeeds.
- Stop here and wait for approval before continuing.

---

## Milestone 2 — Minimal React application

Status: **Completed**

Goal: create the frontend shell and ensure it runs locally.

Tasks:
- Initialize a Vite React + TypeScript app in frontend/.
- Keep the UI minimal: title "Voice2Sheet" and text "Prototype ready".
- Ensure the layout is mobile-friendly.
- Run the app locally and verify it opens in a browser.

Acceptance:
- [x] The user can run the app locally and view the prototype screen.
- Stop here and wait for approval before continuing.

---

## Milestone 3 — Azure Static Web Apps deployment

Goal: deploy the frontend to Azure and confirm the phone view works.

Tasks:
- Set up an Azure Static Web App for the frontend.
- Use the simplest supported deployment path from the current Azure docs.
- Use the Azure-generated hostname.
- Do not configure a custom domain.
- Confirm the deployed app shows the expected prototype screen.

Acceptance:
- The user opens the Azure URL on a phone and sees the prototype text.
- Stop here and wait for approval before continuing.

---

## Milestone 4 — Azure Functions backend skeleton

Goal: create a minimal backend and a simple health endpoint.

Tasks:
- Create the Azure Functions Node.js + TypeScript backend under api/.
- Implement GET /api/health returning JSON { "status": "ok" }.
- Validate the endpoint locally.

Acceptance:
- Local call to /api/health returns HTTP 200 and the expected JSON.
- Stop here and wait for approval before continuing.

---

## Milestone 5 — Health check from React

Goal: connect frontend to backend health endpoint.

Tasks:
- Add a frontend call to /api/health.
- Display "Backend: online" when successful.
- Show a clear failure state if the request fails.
- Verify locally in browser.

Acceptance:
- Frontend and backend run locally together.
- Page displays "Backend: online".
- Stop here and wait for approval before continuing.

---

## Milestone 6 — Azure frontend + API deployment

Goal: deploy the integrated frontend and backend to Azure Static Web Apps.

Tasks:
- Follow the simplest Azure Static Web Apps + Functions integration pattern.
- Deploy the full app.
- Confirm /api/health is reachable from the deployed frontend.
- Ensure the page shows "Backend: online".

Acceptance:
- The deployed Azure URL successfully calls /api/health and displays the correct status.
- Stop here and wait for approval before continuing.

---

## Milestone 7 — Hard-coded text to structured command

Goal: validate the OpenAI interpretation path without touching Google Sheets.

Tasks:
- Implement POST /api/interpret.
- Use hard-coded or manually entered Hungarian text as input.
- Call the OpenAI API with a strict schema.
- Validate the response on the backend.
- Return the validated structure to the frontend.
- Show the JSON result in the UI.

Acceptance:
- The frontend displays the expected structured add_grade result.
- Invalid model output causes an error instead of a write.
- Stop here and wait for approval before continuing.

---

## Milestone 8 — Google Cloud / Sheets API preparation

Goal: prepare the backend for Google Sheets access in a single-user prototype.

Tasks:
- Guide the user through the current official Google Cloud setup docs.
- Create the project and enable the Sheets API.
- Choose the simplest server-side authentication pattern.
- Grant the service account only the spreadsheet access required.
- Confirm the backend can access the specific spreadsheet without exposing credentials to the frontend.

Acceptance:
- The backend can read a harmless known value from the test spreadsheet.
- Stop here and wait for approval before continuing.

---

## Milestone 9 — Read spreadsheet structure

Goal: read the real spreadsheet structure deterministically.

Tasks:
- Implement backend read logic for the relevant sheet.
- Verify the targeted spreadsheet and sheet are open.
- Confirm that student data can be read from the expected locations.
- Ensure the code can identify student records safely.

Acceptance:
- A known student can be found from backend code.
- Stop here and wait for approval before continuing.

---

## Milestone 10 — Controlled Google Sheets test write

Goal: verify write access without involving AI or live grade logic.

Tasks:
- Create an isolated test area in the spreadsheet.
- Perform a hard-coded write to a known location, such as VOICE2SHEET_TEST.
- Read the value back through the API.
- Verify the read-back matches the requested value.

Acceptance:
- The user sees the exact expected value in the exact test location.
- Stop here and wait for approval before continuing.

---

## Milestone 11 — Deterministic student resolution

Goal: resolve a student record without using the LLM.

Tasks:
- Implement deterministic lookup from class + identifier.
- Accept only exactly one resolved student.
- Handle not found and ambiguous cases explicitly.
- Return clear resolution states: RESOLVED, NOT_FOUND, AMBIGUOUS.

Acceptance:
- Test at least: valid student, nonexistent student, and ambiguous input if the structure allows it.
- Stop here and wait for approval before continuing.

---

## Milestone 12 — Proposed operation

Goal: build the confirmation step without writing to Google Sheets.

Tasks:
- Combine interpreted intent + deterministic student resolution.
- Create a pending operation object with a generated operationId.
- Display a human-readable confirmation summary.
- Ensure pressing Mégse performs zero writes.

Acceptance:
- The prepared operation is visible to the user and no data is written.
- Stop here and wait for approval before continuing.

---

## Milestone 13 — Confirmation to Google Sheets

Goal: complete the write after explicit confirmation.

Tasks:
- Implement a confirmation endpoint referencing the prepared operation.
- Validate the operation before writing.
- Execute the deterministic Google Sheets write.
- Verify the written value by reading it back.
- Prevent accidental duplicate execution.

Acceptance:
- One expected change occurs only after Beírás is pressed.
- Success is shown only after verification passes.
- Stop here and wait for approval before continuing.

---

## Milestone 14 — Record audio in browser

Goal: capture a short microphone recording on a mobile device.

Tasks:
- Add a large record button labeled "🎤 Felvétel".
- Allow start/stop recording.
- Show that recording audio actually occurred.
- Keep the scope to local browser recording only.

Acceptance:
- Recording works on the target Android phone/browser.
- Stop here and wait for approval before continuing.

---

## Milestone 15 — Speech-to-text transcription

Goal: convert captured audio to text in a reliable, user-visible way.

Tasks:
- Send recorded audio to the backend.
- Send it to the selected OpenAI speech-to-text model.
- Return the transcription to the frontend.
- Display the recognized text before interpretation.
- Validate this on several natural Hungarian teacher commands.

Acceptance:
- Recognition is reliable enough for the target scenario.
- Stop here and wait for approval before continuing.

---

## Milestone 16 — End-to-end workflow

Goal: connect the whole user flow.

Tasks:
- Connect record → transcribe → display transcription → interpret → validate → resolve student → show confirmation → user confirm → write → read-back verification → success.
- Ensure all stages are visible to the user.
- Keep the final behavior simple and mobile-first.

Acceptance:
- The user can complete the whole scenario from phone recording to verified Google Sheet write.
- Stop here and wait for approval before continuing.

---

## Milestone 17 — Error handling and logging

Goal: make the prototype safe and understandable when failures happen.

Tasks:
- Add explicit handling for microphone permission denied, empty recording, transcription failure, invalid schema, unsupported intent, invalid grade, missing identifier, student not found, ambiguous record selection, Google API errors, write failure, and verification failure.
- Show errors to the user.
- Keep logging minimal and avoid storing sensitive data.

Acceptance:
- Failures are explicit, visible, and never silently become writes.
- Stop here and wait for approval before considering the prototype complete.

---

## Definition of done for the prototype

The prototype is complete only when all of the following are true:

- A spoken Hungarian command is transcribed correctly.
- The command is converted into a valid add_grade structured command.
- Exactly one student is resolved deterministically.
- The user sees a human-readable confirmation.
- The user must explicitly confirm before any write.
- A single correct Google Sheets value is written.
- A read-back verification succeeds.
- The user sees success only after verification.

This is the final quality bar for the initial version.
