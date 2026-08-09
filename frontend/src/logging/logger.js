// logging/logger.js
//
// Generic configurable frontend logging.
//
// This module centralizes frontend logging so React components, API clients,
// and other application code do not need to contain repeated checks against
// VITE_LOG_LEVEL or call console.log() directly.
//
// VITE_LOG_LEVEL controls how much information is written:
//
//   none
//     Disables frontend application logging.
//
//   summary
//     Writes important application events and errors.
//
//   verbose
//     Includes everything from summary plus additional diagnostic details
//     useful during development and troubleshooting.
//
// Configure the level through the Vite environment:
//
//   VITE_LOG_LEVEL=none
//   VITE_LOG_LEVEL=summary
//   VITE_LOG_LEVEL=verbose
//
// Defaults to "none" when VITE_LOG_LEVEL is missing or invalid.


// Numeric values make the logging levels hierarchical:
//
//   none < summary < verbose
//
// This allows verbose mode to automatically include summary messages without
// requiring separate checks for every possible level.
const LEVELS = {
  none: 0,
  summary: 1,
  verbose: 2,
}


// Vite exposes frontend environment variables through import.meta.env.
//
// Only variables prefixed with VITE_ are exposed to frontend application code.
// Because these values are compiled into the frontend bundle, VITE_* variables
// must NEVER contain passwords, API keys, tokens, or other secrets.
//
// Convert the configured value to lowercase so values such as SUMMARY or
// Verbose behave as expected.
const configuredLevel =
  (import.meta.env.VITE_LOG_LEVEL || 'none').toLowerCase()


// Validate the configured level.
//
// An unsupported or missing value intentionally falls back to "none" rather
// than unexpectedly enabling logging.
export const LOG_LEVEL =
  configuredLevel in LEVELS ? configuredLevel : 'none'


// ---------------------------------------------------------------------------
// Summary logging
// ---------------------------------------------------------------------------
//
// Writes messages when the configured level is:
//
//   summary
//   verbose
//
// LOG_LEVEL=none suppresses the message.
//
// `details` is optional so callers can log either a simple message:
//
//   logSummary('Backend health check succeeded')
//
// or a message with associated information:
//
//   logSummary('Backend health check succeeded', {
//     status: 200
//   })
export function logSummary(message, details) {
  if (LEVELS[LOG_LEVEL] < LEVELS.summary) {
    return
  }

  details === undefined
    ? console.log(message)
    : console.log(message, details)
}


// ---------------------------------------------------------------------------
// Verbose logging
// ---------------------------------------------------------------------------
//
// Writes diagnostic information ONLY when:
//
//   VITE_LOG_LEVEL=verbose
//
// Use this for information that is useful while diagnosing application
// behavior but would be unnecessarily noisy during normal summary logging.
//
// Example:
//
//   logVerbose('Health response', response)
export function logVerbose(message, details) {
  if (LEVELS[LOG_LEVEL] < LEVELS.verbose) {
    return
  }

  details === undefined
    ? console.log(message)
    : console.log(message, details)
}


// ---------------------------------------------------------------------------
// Error logging
// ---------------------------------------------------------------------------
//
// Errors are considered summary-level information and therefore appear when
// the configured level is:
//
//   summary
//   verbose
//
// LOG_LEVEL=none suppresses them.
//
// This function is for diagnostic logging only. It does not replace the
// application's user-facing ErrorMessage component or other UI error handling.
//
// Example:
//
//   try {
//     ...
//   } catch (error) {
//     logError('Backend health check failed', error)
//   }
export function logError(message, error) {
  if (LEVELS[LOG_LEVEL] < LEVELS.summary) {
    return
  }

  error === undefined
    ? console.error(message)
    : console.error(message, error)
}