/**
 * Vercel serverless entry point for the Angular SSR server.
 *
 * Vercel's built-in Angular preset is static-only: it builds with `ng build`,
 * serves `dist/<project>/browser`, and never invokes `server.mjs`. This wrapper
 * is what turns the compiled Angular server into a Vercel Function, and
 * `vercel.json` rewrites traffic here.
 *
 * The import is dynamic and inside the handler so the (large) server bundle is
 * only evaluated when a request actually arrives, and so a failure to resolve
 * it surfaces as a runtime error with a stack rather than a silent cold-start
 * crash.
 *
 * `dist/**` reaches the function only because `vercel.json` lists it under
 * `functions.includeFiles` — without that the deploy succeeds and then fails on
 * this import.
 */
export default async function handler(req, res) {
  const { reqHandler } = await import('../dist/fake-store/server/server.mjs');

  return reqHandler(req, res);
}
