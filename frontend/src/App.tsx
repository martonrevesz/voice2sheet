import { useEffect, useState } from 'react'

import './App.css'

type BackendStatus = 'checking' | 'online' | 'offline'

function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking')

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

  return (
    <main className="app">
      <h1>Voice2Sheet</h1>
      <p>Prototype ready</p>
      <p className={`backend-status backend-status--${backendStatus}`}>
        {backendStatus === 'checking' && 'Backend: checking…'}
        {backendStatus === 'online' && 'Backend: online'}
        {backendStatus === 'offline' && 'Backend: unavailable'}
      </p>
    </main>
  )
}

export default App
