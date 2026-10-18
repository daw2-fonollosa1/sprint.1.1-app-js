# Testing

Pure business logic is covered with Node.js's built-in test runner. Tests use an in-memory storage adapter and do not need a browser, database, or external package.

```bash
npm test
```

The suite currently contains 39 tests. It verifies initialization and persistence, CRUD validation, role permissions, assignment integrity, authentication, grade ownership, and multiple-teacher arithmetic averages. The suite passed locally and in a disposable Node.js 22 container, matching the GitHub Actions runtime.

The local static server and the Docker Compose service returned HTTP 200 for `/`. The Nginx image built successfully and the documented host port `8080` was reachable. Firefox is installed, but it could not start headlessly because its system profile setup attempted to write into a read-only configuration directory; no WebDriver or browser automation package is installed. Page-level interactions and mobile breakpoints therefore remain unverified in this environment.
