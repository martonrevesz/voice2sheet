import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import './App.css'

type BackendStatus = 'checking' | 'online' | 'offline'

interface AddGradeCommand {
  schemaVersion: '1.0'
  intent: 'add_grade'
  student: {
    class: string | null
    identifier: string | null
    name: string | null
  }
  grade: 1 | 2 | 3 | 4 | 5
}

type InterpretationResult =
  | { status: 'accepted'; command: AddGradeCommand }
  | {
      status: 'rejected'
      reason: 'unsupported_intent' | 'ambiguous_command' | 'missing_information'
    }

function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking')
  const [commandText, setCommandText] = useState(
    'Adj egy ötöst az 5.A hatos számú tanulójának.',
  )
  const [interpretation, setInterpretation] = useState<InterpretationResult | null>(null)
  const [interpretError, setInterpretError] = useState<string | null>(null)
  const [isInterpreting, setIsInterpreting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function checkBackend() {
      try {
        const response = await fetch('/api/health', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Health check failed with status ${response.status}`)
        }

        const result: unknown = await response.json()

        if (
          typeof result !== 'object' ||
          result === null ||
          !('status' in result) ||
          result.status !== 'ok'
        ) {
          throw new Error('Health check returned an unexpected response')
        }

        setBackendStatus('online')
      } catch (error) {
        if (!controller.signal.aborted) {
          setBackendStatus('offline')
          console.error('Backend health check failed', error)
        }
      }
    }

    void checkBackend()

    return () => controller.abort()
  }, [])

  async function handleInterpret(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsInterpreting(true)
    setInterpretError(null)
    setInterpretation(null)

    try {
      const response = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commandText }),
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        const message =
          typeof result === 'object' &&
          result !== null &&
          'error' in result &&
          typeof result.error === 'string'
            ? result.error
            : 'A parancs értelmezése sikertelen.'
        throw new Error(message)
      }

      setInterpretation(result as InterpretationResult)
    } catch (error) {
      setInterpretError(
        error instanceof Error ? error.message : 'A parancs értelmezése sikertelen.',
      )
    } finally {
      setIsInterpreting(false)
    }
  }

  return (
    <main className="app">
      <h1>Voice2Sheet</h1>
      <p>Prototype ready</p>
      <p className={`backend-status backend-status--${backendStatus}`}>
        {backendStatus === 'checking' && 'Backend: checking…'}
        {backendStatus === 'online' && 'Backend: online'}
        {backendStatus === 'offline' && 'Backend: unavailable'}
      </p>
      <form className="interpret-form" onSubmit={handleInterpret}>
        <label htmlFor="command-text">Parancs</label>
        <textarea
          id="command-text"
          value={commandText}
          onChange={(event) => setCommandText(event.target.value)}
          maxLength={500}
          rows={4}
          required
        />
        <button type="submit" disabled={isInterpreting || backendStatus !== 'online'}>
          {isInterpreting ? 'Értelmezés…' : 'Értelmezés'}
        </button>
      </form>
      {interpretError && <p className="interpret-error">{interpretError}</p>}
      {interpretation && (
        <pre className="command-result">{JSON.stringify(interpretation, null, 2)}</pre>
      )}
    </main>
  )
}

export default App
