# Voice2Sheet architecture

## Overview

Voice2Sheet is a small, mobile-first prototype built around a simple safety-first flow:

1. Capture spoken Hungarian command in the browser.
2. Transcribe the audio.
3. Interpret the text using a strict structured-output schema.
4. Resolve the student deterministically in backend code.
5. Show a human-readable confirmation to the user.
6. Write to Google Sheets only after explicit confirmation.
7. Verify the write and show a success or failure message.

The design intentionally keeps business logic in the backend and keeps secret-bearing operations away from the browser.

---

## Components

### Frontend

- React + TypeScript + Vite
- Mobile-first UI for phone usage
- Browser microphone recording
- Display of transcript, interpreted command, confirmation screen, and result state
- No direct access to OpenAI or Google credentials

### Backend

- Azure Functions with Node.js / TypeScript
- Handles:
  - health endpoint
  - transcription request forwarding
  - OpenAI structured command interpretation
  - schema validation
  - deterministic spreadsheet resolution
  - Google Sheets reads and writes
  - confirmation and verification logic
- Owns all secret management and privileged API calls

### AI layer

- OpenAI API used only for:
  - speech-to-text
  - natural-language interpretation into a strict schema
- The model never chooses spreadsheet targets or performs writes.
- All output is validated by backend code before it can affect data.

### Google Sheets layer

- Google Sheets API used only from backend logic
- Backend resolves student rows and determines the exact cell/range
- Writes happen only after explicit confirmation and are followed by read-back verification

---

## Core safety rule

The LLM may produce a structured intent, but it must not decide where data is written.

This means the backend always performs the following sequence:

- Parse the model output into a validated schema
- Resolve the student using deterministic backend logic
- Determine the exact destination cell or range
- Show the user a readable summary
- Wait for confirmation
- Perform the Google Sheets write
- Verify the stored value

This prevents silent or unsafe writes.

---

## Data flow

```text
Browser microphone
  -> audio capture
  -> transcript display
  -> POST /api/interpret
  -> backend validates structured intent
  -> backend resolves student record deterministically
  -> proposed operation shown to user
  -> user confirms
  -> backend writes to Google Sheets
  -> backend verifies value
  -> success/failure message
```

---

## Initial version scope

Version 1 supports only one intent:

- add_grade

No other write operations are included in the initial implementation. This keeps the system safe, simple, and easy to verify.

---

## Why this architecture fits the prototype

- Minimal complexity
- Clear separation of responsibilities
- Strong safety boundaries
- Low infrastructure cost
- Easy local development and deployment
- Sufficient flexibility to expand later with more intents if needed
