import React, { useCallback, useEffect, useState } from 'react'
import { getHealth } from '../api/client.js'
import ErrorMessage from './ErrorMessage.jsx'

export default function BackendHealthCard() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkHealth = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getHealth()
      setHealth(result)
    } catch (err) {
      setHealth(null)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  const healthy = Boolean(health?.ok)

  return (
    <section className="app-card health-card" aria-labelledby="backend-health-title">
      <div className="card-heading-row">
        <div>
          <div className="app-eyebrow">SYSTEM</div>
          <h2 id="backend-health-title">Backend Health</h2>
        </div>

        <button className="btn-secondary" type="button" onClick={checkHealth} disabled={loading}>
          {loading ? 'Checking…' : 'Refresh'}
        </button>
      </div>

      {!loading && !error && (
        <div className={`health-status ${healthy ? 'is-healthy' : 'is-unhealthy'}`}>
          <span className="status-dot" aria-hidden="true" />
          <div>
            <strong>{healthy ? 'Backend connected' : 'Backend responded with a problem'}</strong>
            <span>{healthy ? 'The API health check completed successfully.' : 'The API is reachable, but health is not OK.'}</span>
          </div>
        </div>
      )}

      {error && (
        <ErrorMessage
          message="The backend health check failed."
          details={{
            message: error.message,
            status: error.status,
            response: error.details,
          }}
        />
      )}

      {health && (
        <details className="health-details">
          <summary>Health response</summary>
          <pre>{JSON.stringify(health, null, 2)}</pre>
        </details>
      )}
    </section>
  )
}
