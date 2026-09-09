// clients/http-client.ts
//
// Generic wrapper around fetch for calling ANY external HTTP API. Not
// tied to a specific service or endpoint — pass a URL (and optional
// fetch options), get back parsed JSON, typed however you specify.
//
// This is real, not simulated: it makes an actual network call. If the
// target host is unreachable, the request times out, or the response
// status isn't 2xx, it throws ExternalApiError — nothing here fakes a
// success response. That's what makes asyncHandler load-bearing for any
// route that calls through this: a genuine rejected promise from fetch()
// (or a thrown ExternalApiError after a bad response) is exactly what
// asyncHandler exists to catch and forward to errorHandler, which maps
// ExternalApiError to a 502.
//
// Usage (fill in guts later — this works with any external API):
//
//   interface WeatherResponse { tempF: number }
//
//   const weather = await fetchJson<WeatherResponse>(
//     "https://api.example.com/weather?city=Baltimore"
//   );
//
// With a timeout and custom headers:
//
//   const data = await fetchJson<SomeShape>(url, {
//     headers: { Authorization: `Bearer ${apiKey}` },
//     timeoutMs: 5000
//   });


// NodeNext/ESM requires explicit file extensions for relative imports.
// Local TypeScript modules therefore use the runtime .js extension even
// though the corresponding source files have a .ts extension. TypeScript
// resolves these imports to the .ts source during compilation, while the
// emitted JavaScript retains .js so it can run directly under Node.js.
import { ExternalApiError } from "../middleware/errors.js";


interface FetchJsonOptions extends RequestInit {
  /** Aborts the request if it hasn't completed within this many ms. */
  timeoutMs?: number;
}


export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {}
): Promise<T> {
  const { timeoutMs = 10_000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
  } catch (err) {
    // Network failure, DNS failure, or the AbortController firing due to
    // timeoutMs above — all land here since fetch() rejects for all of
    // these rather than returning a response object.
    const reason = err instanceof Error ? err.message : String(err);
    throw new ExternalApiError(`Request to ${url} failed: ${reason}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    // Fetch does NOT reject on non-2xx status (404, 500, etc.) — that's
    // treated as a "successful" fetch as far as the Promise is concerned.
    // This is the check that turns a bad status into an actual error.
    throw new ExternalApiError(
      `Request to ${url} returned ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as T;
}
