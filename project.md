# Voice2Sheet

## 1. Project goal

Create a minimal, mobile-first web application for personal teacher use.

The application allows the user to speak short natural-language commands such as:

> "Adj egy ötöst az 5.A hatos számú tanulójának."

or later:

> "Kovács Anna kapott egy ötöst."

The application converts speech to text, interprets the text as a **strictly structured command**, shows the interpreted operation to the user for confirmation, and only after explicit confirmation writes the result to a Google Sheet.

The primary priorities are:

1. **Reliability and data safety**
2. **Minimal implementation effort**
3. **Simple architecture**
4. **Low operating cost**
5. Mobile usability

This is initially a **single-user personal prototype**.

Do not over-engineer it for multiple teachers, schools, tenants, large scale, or commercial distribution.

---

# 2. Core safety principle

The LLM MUST NOT decide where data is written in Google Sheets.

The LLM is only responsible for converting natural language into a structured intent.

For example:

Natural language:

> "Az 5.A hatos számú tanulója kapjon egy ötöst."

LLM output:

```json
{
  "schemaVersion": "1.0",
  "intent": "add_grade",
  "student": {
    "class": "5.A",
    "identifier": "6"
  },
  "grade": 5
}
```

The LLM must NOT return:

* spreadsheet IDs
* sheet names unless they are explicitly part of the domain model
* row numbers
* column numbers
* cell addresses
* Google Sheets API operations

The backend is solely responsible for translating the structured command into a concrete Google Sheets operation.

**LLM output is untrusted input and must always be validated by deterministic backend code.**

---

# 3. Mandatory confirmation rule

No user data may be modified immediately after speech recognition or LLM interpretation.

The workflow MUST be:

```text
speech
  ↓
speech-to-text
  ↓
LLM interpretation
  ↓
schema validation
  ↓
deterministic lookup
  ↓
proposed operation
  ↓
USER CONFIRMATION
  ↓
write to Google Sheets
  ↓
verify result
  ↓
success/failure message
```

The confirmation screen should contain human-readable information such as:

```text
5.A
6. tanuló
Érdemjegy: 5

[ Mégse ]     [ Beírás ]
```

The actual Google Sheets write must happen only after pressing **Beírás**.

---

# 4. Initial scope

Version 1 supports exactly one write operation:

```text
add_grade
```

Do NOT initially implement:

* homework notes
* absences
* behaviour notes
* deleting grades
* editing existing grades
* multiple teachers
* administration UI
* complex user management
* analytics
* reporting

These can be added later after `add_grade` works reliably.

---

# 5. Planned future intents

The command schema must be designed so that it can later support additional intents such as:

```text
add_grade
add_homework_note
record_absence
add_student_note
```

Do NOT implement these now.

---

# 6. Technology stack

## Frontend

Use:

* React
* TypeScript
* Vite
* mobile-first responsive UI

Hosting:

* Azure Static Web Apps

A custom domain is NOT required for the prototype.

Use the Azure-provided URL.

The application should later be usable from the Android home screen like a simple web app/PWA.

---

## Backend

Preferred implementation:

* Azure Functions
* Node.js / TypeScript

Use the simplest currently supported Azure Functions Node.js programming model.

The backend must contain all secrets and all privileged API access.

No OpenAI or Google credential may ever be included in frontend JavaScript.

---

## AI

Use the OpenAI API.

Responsibilities:

1. speech-to-text
2. natural-language command interpretation
3. structured output according to a strict schema

Prefer inexpensive models when they provide sufficient reliability.

Use Structured Outputs / JSON schema validation where appropriate rather than asking the model to "please return JSON".

The exact model names should NOT be hard-coded into this specification. When implementing the OpenAI integration, check the current official OpenAI documentation and select an appropriate currently supported model.

---

## Google

Use:

* Google Sheets API

The backend is responsible for:

* reading the required spreadsheet structure
* resolving a student to exactly one record
* determining the destination cell/range
* performing the write
* verifying the result

Prefer official Google client libraries.

---

# 7. Repository structure

Start with approximately this structure:

```text
voice2sheet/
│
├── PROJECT.md
├── TASKS.md
├── ARCHITECTURE.md
├── README.md
├── .gitignore
│
├── frontend/
│   └── React application
│
└── api/
    └── Azure Functions application
```

Do not introduce additional projects, services, databases or infrastructure unless they are actually required.

---

# 8. Agent working agreement

This section is an instruction to the coding agent working on this repository.

## IMPORTANT: work incrementally

Do NOT attempt to implement the whole application at once.

Work on exactly **one milestone at a time**.

For every milestone:

1. Explain briefly what you are about to change.
2. Make the smallest reasonable implementation.
3. Run available automated checks.
4. Tell the user exactly how to test the result manually.
5. STOP.
6. Wait for explicit user confirmation before starting the next milestone.

Do not silently continue to the next milestone.

---

## Prefer working software over architecture

This is a small personal prototype.

Prefer:

* simple code
* official SDKs
* few dependencies
* few abstractions
* short functions
* explicit validation
* easily testable behavior

Avoid:

* unnecessary design patterns
* microservices
* databases unless clearly needed
* queues
* event buses
* elaborate dependency injection
* premature generic frameworks

Reliability is important, but architectural complexity is not a goal.

---

## Never expose secrets

Never:

* commit API keys
* put API keys into React source
* store secrets in Git
* print complete secrets into logs

Use local environment variables during development.

Use Azure application settings / appropriate Azure secret configuration after deployment.

Ensure relevant local secret files are included in `.gitignore`.

---

# 9. Development milestones

Each milestone must end with a manually testable working state.

---

## Milestone 0 — Verify local development environment

Check whether the following are installed:

* Git
* Node.js
* npm
* VS Code
* Azure Functions development tooling as required
* Azure CLI if required for the chosen deployment workflow

Do not install unnecessary tooling.

### Acceptance test

The agent reports the detected versions and identifies any missing prerequisite.

STOP after this milestone.

---

# 10. External setup

Some steps require the user to work in external web consoles.

For these tasks, the coding agent must:

1. consult current official documentation when possible;
2. give the user step-by-step instructions;
3. ask the user to perform the operation;
4. never ask the user to paste secret keys into the chat;
5. wait until the user confirms completion.

---

## Milestone 1 — OpenAI API setup

The ChatGPT subscription and OpenAI API billing are separate services.

The user must configure API access separately.

The coding agent should guide the user through the current official OpenAI procedure.

At minimum:

1. Open the OpenAI API Platform.
2. Confirm/create the appropriate API project.
3. Configure API billing if required.
4. Configure a conservative spending/usage limit if available.
5. Create a project API key.
6. Store the key locally as an environment variable such as:

```text
OPENAI_API_KEY
```

Never commit this value.

Never put it in the React application.

### Acceptance test

A minimal local backend script/function successfully makes one harmless OpenAI API request.

Do not proceed until this works.

STOP.

---

# 11. Frontend

## Milestone 2 — Minimal React application

Create:

* React
* TypeScript
* Vite

The initial UI should contain only:

```text
Voice2Sheet

Prototype ready
```

Make it comfortable to view on a mobile-sized screen.

Do not build the real UI yet.

### Acceptance test

The user can run the application locally and open it in a browser.

STOP.

---

# 12. First deployment

## Milestone 3 — Azure Static Web Apps

Create an Azure Static Web App for the React frontend.

Prefer the simplest deployment mechanism supported by the current Azure documentation.

Use the Azure-generated hostname.

Do not configure a custom domain.

### Acceptance test

The user opens the Azure URL on their phone and sees:

```text
Voice2Sheet

Prototype ready
```

STOP.

---

# 13. Backend skeleton

## Milestone 4 — Azure Functions

Create the minimal Azure Functions backend using Node.js and TypeScript.

Create:

```text
GET /api/health
```

Example response:

```json
{
  "status": "ok"
}
```

No OpenAI or Google integration yet.

### Acceptance test

Calling `/api/health` locally returns HTTP 200 and the expected JSON.

STOP.

---

# 14. Frontend → backend communication

## Milestone 5 — Health check from React

The React application calls the backend health endpoint.

Display:

```text
Backend: online
```

on success.

Display a clear error state if the call fails.

### Acceptance test

The user starts frontend and backend locally.

The page shows:

```text
Backend: online
```

STOP.

---

# 15. Deploy backend integration

## Milestone 6 — Azure frontend + API

Deploy the frontend and Azure Functions integration using the simplest appropriate Azure Static Web Apps architecture.

Use the current official Azure Static Web Apps documentation when deciding whether to use managed Functions or another supported integration.

Prefer the option requiring the least infrastructure for this prototype.

### Acceptance test

On the deployed Azure URL, the frontend successfully calls:

```text
/api/health
```

and displays:

```text
Backend: online
```

STOP.

---

# 16. Structured command schema

## Version 1

Initial schema:

```json
{
  "schemaVersion": "1.0",
  "intent": "add_grade",
  "student": {
    "class": "5.A",
    "identifier": "6",
    "name": null
  },
  "grade": 5
}
```

Rules:

### schemaVersion

Required.

Initial value:

```text
1.0
```

### intent

Required.

For version 1 the only allowed value is:

```text
add_grade
```

### student.class

Class identifier if supplied.

Example:

```text
5.A
```

### student.identifier

Student identifier/index if supplied.

Example:

```text
6
```

### student.name

Student name if supplied.

Example:

```text
Kovács Anna
```

A command may identify a student by identifier, name, or another explicitly supported deterministic identifier.

The backend must eventually resolve this to exactly one student.

### grade

Required for `add_grade`.

Allowed values initially:

```text
1
2
3
4
5
```

The backend must reject any other value.

---

# 17. Important ambiguity rule

The LLM must NOT invent missing information.

For example, if the user says:

> "Adj neki egy ötöst."

and there is no safe deterministic context identifying exactly one student, the result must NOT be executable.

Similarly, if student lookup finds:

```text
0 matches
```

or:

```text
2+ matches
```

the system must refuse to prepare a write operation.

Only exactly one resolved student is acceptable.

---

# 18. OpenAI command parsing

## Milestone 7 — Hard-coded text → structured command

Create an endpoint similar to:

```text
POST /api/interpret
```

Initially send hard-coded or manually entered text.

Example:

```text
Adj egy ötöst az 5.A hatos számú tanulójának.
```

The OpenAI API should return data conforming to the defined schema.

Validate the response on the backend.

Do NOT connect Google Sheets yet.

Return the validated structure to the frontend.

### Acceptance test

The frontend displays something equivalent to:

```json
{
  "schemaVersion": "1.0",
  "intent": "add_grade",
  "student": {
    "class": "5.A",
    "identifier": "6",
    "name": null
  },
  "grade": 5
}
```

Invalid model output must result in an error, not an attempted recovery/write.

STOP.

---

# 19. Google setup

## Milestone 8 — Google Cloud / Sheets API preparation

The coding agent should guide the user through the current official Google documentation.

Required outcome:

1. Google Cloud project available.
2. Google Sheets API enabled.
3. Appropriate authentication mechanism configured.
4. Backend can access exactly the spreadsheet required for the prototype.

Choose the simplest authentication mechanism that is appropriate for a single-user server-side prototype.

Do not make the spreadsheet publicly writable.

Do not store Google credentials in frontend code.

If using a service identity/service account, grant it access only to the spreadsheet(s) required.

### Acceptance test

The backend can read a harmless known value from the test spreadsheet.

STOP.

---

# 20. Google Sheets read

## Milestone 9 — Read spreadsheet structure

Implement deterministic code for reading the relevant spreadsheet data.

Initially do NOT write anything.

Return enough information to demonstrate that:

* the correct spreadsheet was opened;
* the expected sheet exists;
* expected student data can be read.

### Acceptance test

A known student can be found from backend code.

STOP.

---

# 21. Test write

## Milestone 10 — Controlled Google Sheets test write

Create a deliberately isolated test location in the spreadsheet.

Perform a hard-coded write such as:

```text
VOICE2SHEET_TEST
```

Do NOT involve the LLM.

### Acceptance test

The user sees the exact expected value in the exact test location.

Then read the value back through the API and verify that the stored value matches the requested value.

STOP.

---

# 22. Deterministic student resolution

## Milestone 11 — Resolve student

Implement backend logic that translates:

```json
{
  "class": "5.A",
  "identifier": "6"
}
```

into exactly one student record.

Possible results:

```text
RESOLVED
NOT_FOUND
AMBIGUOUS
```

Only `RESOLVED` may continue toward a write.

The LLM must not participate in this lookup.

### Acceptance test

Test at least:

1. valid student;
2. nonexistent student;
3. deliberately ambiguous input if the sheet structure allows it.

STOP.

---

# 23. Prepare operation — do not execute

## Milestone 12 — Proposed operation

Combine:

```text
interpreted intent
+
deterministic student resolution
```

to create a proposed operation.

Example internal structure:

```json
{
  "operationId": "generated-id",
  "status": "pending_confirmation",
  "intent": "add_grade",
  "student": {
    "class": "5.A",
    "identifier": "6",
    "displayName": "Kovács Anna"
  },
  "grade": 5
}
```

The frontend should display a human-readable confirmation.

Example:

```text
Biztosan beírod?

5.A
6. tanuló
Kovács Anna

Érdemjegy: 5

[Mégse] [Beírás]
```

Nothing is written to Google Sheets at this point.

### Acceptance test

Pressing **Mégse** performs zero writes.

STOP.

---

# 24. Confirmed write

## Milestone 13 — Confirmation → Google Sheets

Implement the confirmed write.

Important:

The confirmation request must refer to the previously prepared operation.

Do not ask the LLM to reinterpret the original sentence after confirmation.

Conceptually:

```text
POST /api/confirm/{operationId}
```

The backend retrieves or validates the prepared operation and performs the deterministic write.

Where practical, protect against accidentally executing the same operation twice.

### Acceptance test

1. Prepare an `add_grade` operation.
2. Verify the sheet has not changed.
3. Press **Beírás**.
4. Verify exactly one expected change occurred.
5. Read the written value back.
6. Display success only after verification.

STOP.

---

# 25. Speech recording

## Milestone 14 — Record audio in browser

Add one large mobile-friendly button:

```text
🎤 Felvétel
```

The browser records a short audio command.

Initially do not send it anywhere.

Allow the user to:

* start recording;
* stop recording;
* see that audio was captured.

### Acceptance test

Recording works on the target Android phone/browser.

STOP.

---

# 26. Speech-to-text

## Milestone 15 — Transcription

Send recorded audio to the backend.

The backend sends it to the selected OpenAI speech-to-text API/model.

Return transcription to the frontend.

Display the recognized text before interpreting it.

Example:

```text
Felismert szöveg:

"Adj egy ötöst az 5.A hatos számú tanulójának."
```

### Acceptance test

Test several real Hungarian teacher commands spoken naturally.

Do not continue until recognition is sufficiently reliable.

STOP.

---

# 27. Complete workflow

## Milestone 16 — End-to-end Voice2Sheet

Connect:

```text
record
↓
transcribe
↓
display transcription
↓
interpret
↓
validate schema
↓
resolve student
↓
display proposed operation
↓
user confirmation
↓
write
↓
read-back verification
↓
success
```

### Acceptance test

Using only the phone:

1. Open Voice2Sheet.
2. Press record.
3. Say a grade command.
4. Stop recording.
5. Check transcription.
6. Check interpreted student and grade.
7. Confirm.
8. Open Google Sheets.
9. Verify that exactly the intended data was changed.

---

# 28. Error handling

Before considering the prototype usable, explicitly handle:

* microphone permission denied
* empty recording
* speech recognition failure
* OpenAI API failure
* malformed structured output
* unsupported intent
* invalid grade
* missing student identifier
* student not found
* multiple matching students
* Google API failure
* write failure
* verification failure
* accidental duplicate confirmation

Failures must be visible to the user.

A failed or ambiguous operation must never silently become a write.

---

# 29. Logging

Keep logging minimal.

Useful information:

* timestamp
* operation ID
* processing stage
* intent
* success/failure
* technical error information

Avoid unnecessarily logging:

* complete API keys
* Google credentials
* full audio recordings
* large amounts of student data

Because this application handles student information, minimize stored/logged personal information.

---

# 30. UI philosophy

This is primarily a phone application.

The final initial screen should be extremely simple.

Conceptually:

```text
Voice2Sheet

       🎤
     Felvétel
```

After recording:

```text
Ezt hallottam:

"Az 5.A hatos számú tanulója kapjon egy ötöst."

[Újra] [Értelmezés]
```

Then:

```text
Beírandó:

5.A
6. tanuló
Kovács Anna
Érdemjegy: 5

[Mégse] [Beírás]
```

Then:

```text
✓ Sikeresen beírva
```

Do not add navigation, dashboards, menus or settings unless they become necessary.

---

# 31. Definition of done for prototype

Version 1 is complete when the following scenario works reliably from the user's Android phone:

```text
spoken Hungarian command
→
correct transcription
→
correct structured add_grade command
→
exactly one student resolved
→
clear confirmation screen
→
explicit user confirmation
→
exactly one correct Google Sheets modification
→
read-back verification
→
success message
```

The prototype is NOT considered successful merely because the LLM usually understands the sentence.

The important success criterion is:

> **No Google Sheets write occurs unless the target and value have been deterministically resolved and explicitly confirmed by the user.**

---

# 32. First instruction to the coding agent

When you first read this file:

**Do not start implementing the entire project.**

First:

1. Read this entire specification.
2. Inspect the current repository.
3. Point out any important ambiguity or contradiction.
4. Create/update `TASKS.md` with the milestones above.
5. Create `ARCHITECTURE.md` containing a concise architecture description and data flow.
6. Do not write application code yet.
7. Tell the user what you propose as Milestone 0.
8. Wait for approval.

After approval, execute only Milestone 0.

Then stop again.
