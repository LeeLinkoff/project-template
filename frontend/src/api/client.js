const API_BASE = import.meta.env.VITE_API_BASE ?? ''

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function request(path, options = {}, retries = 2, delayMs = 750) {
  const url = `${API_BASE}${path}`
  let lastError

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...(options.body ? { 'content-type': 'application/json' } : {}),
          ...options.headers,
        },
      })

      const text = await response.text()
      let data = null

      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          data = text
        }
      }

      if (!response.ok) {
        const error = new Error(`API request failed with status ${response.status}`)
        error.status = response.status
        error.details = data
        throw error
      }

      return data
    } catch (error) {
      lastError = error
      if (attempt < retries) await sleep(delayMs)
    }
  }

  throw lastError
}

export function getHealth() {
  return request('/api/health')
}
