# Local-only Allberto integration checks

Run `npx playwright test --config playwright.allberto-local.config.ts` from the repository root. Uses installed Chrome and launches localhost Vite; no backend, `.env`, upstream Playwright setup, account reset, or production build.

For manual Orca inspection, run `npx vite --config tests/local/vite.config.ts`, then open `http://127.0.0.1:4178/tests/local/index.html?route=%2Fdashboard&lang=pt_BR&theme=light`.

The real shell/pages are rendered with explicitly synthetic fixtures. API writes and unmapped endpoints fail closed; CSP and Playwright routing block external traffic. Routes outside the named local surfaces are not mounted. This is not authentication, backend, or financial-flow acceptance. See `docs/handoffs/astra-local-validation.md` for exact coverage, execution status, artifacts and limitations. Test artifacts stay in ignored `tests/local/artifacts/`.
