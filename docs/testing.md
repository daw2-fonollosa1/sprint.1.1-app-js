# Testing

Pure business logic is covered with Node.js's built-in test runner. Tests use an in-memory storage adapter and do not need a browser, database, or external package.

```bash
npm test
```

The suite currently contains 39 tests. It verifies initialization and persistence, CRUD validation, role permissions, assignment integrity, authentication, grade ownership, and multiple-teacher arithmetic averages. The suite passed locally and in a disposable Node.js 22 container, matching the GitHub Actions runtime.

The local static server returned HTTP 200 during a smoke check. The Docker image builds successfully, and Nginx serves `index.html` with HTTP 200 from inside the running container. The environment's Docker daemon did not expose the configured `8080:80` host port, so host access through the published container port could not be confirmed. Firefox is installed, but it could not start headlessly because its system profile setup attempted to write into a read-only configuration directory; no WebDriver or browser automation package is installed. Page-level interactions and mobile breakpoints therefore remain unverified in this environment.
