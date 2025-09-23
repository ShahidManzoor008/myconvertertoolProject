# Testing and Linting

Quick reference for running tests and linters in this monorepo.

Notes
- This repo is a monorepo with `client/` (React + Vite + Vitest) and `server/` (Node/Express + Jest) packages.
- On Windows, `mongodb-memory-server` may fail to download/start. The server test setup falls back to the `MONGODB_URI` (default: `mongodb://localhost:27017/myconvertertool`) — make sure you have a local MongoDB running for tests to pass.

Client (frontend)

- Run unit tests (Vitest):

```powershell
npm test --prefix client
```

- Run ESLint in the client:

```powershell
npm run lint --prefix client
```

Server (backend)

- Run server tests (Jest + ESM support):

```powershell
npm test --prefix server
```

Notes on the server test runner:
- Tests are executed using Node's `--experimental-vm-modules` flag to allow ESM imports inside the test runtime. This is configured in `server/package.json` test script.
- If you prefer not to use VM Modules, you can run the tests in an environment that supports ESM natively for Jest or adapt the tests to CommonJS.

Full monorepo check

To run both client and server tests and the client linter (recommended):

```powershell
npm test --prefix server; npm test --prefix client; npm run lint --prefix client
```

Common troubleshooting

- "Invalid hook call" or React "useRef" errors in client tests:
  - Ensure only a single React copy is resolved. We enforce this with `vite.config.js` aliases and `resolve.dedupe`.
  - Remove local copies of `react`/`react-dom` from `client/node_modules` if you see duplication.

- mongodb-memory-server fails to start on Windows:
  - Ensure you have a working local MongoDB and the `server` tests will fall back to `MONGODB_URI`.
  - Alternatively, configure CI/Dev to allow mongodb-memory-server to download binaries (network, proxy, and permissions).

Contact

If you want me to run the full tests and fix remaining deprecation warnings (`deps.inline` in `vite.config.js`) and the single ESLint warning about missing useEffect dep, tell me and I'll continue.