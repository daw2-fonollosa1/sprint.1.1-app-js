# Testing

Pure business logic is covered with Node.js's built-in test runner. Tests use an in-memory storage adapter and do not need a browser, database, or external package.

```bash
npm test
```

The suite verifies initialization and persistence, CRUD validation, role permissions, assignment integrity, authentication, grade ownership, and multiple-teacher arithmetic averages. Browser rendering is implemented without a DOM dependency; page-level visual checks should be performed in a browser at desktop and mobile widths.
