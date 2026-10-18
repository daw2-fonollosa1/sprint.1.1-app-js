# Architecture

The static entry point is `frontend/index.html`. It loads Bootstrap, the shared stylesheet, and the ES module entry point `frontend/js/app.js`.

```text
app.js
├── modules/storage.js       localStorage serialization, initialization, and schema version
├── modules/demo-data.js     repeatable initial records
├── modules/auth.js          sign-in, persisted session, and logout
├── modules/users.js         user validation and administrator-only operations
├── modules/projects.js      project CRUD and creator permissions
├── modules/evaluable-items.js reusable item CRUD
├── modules/assignments.js   teacher, student, and item relationships
├── modules/grades.js        grade rules, ownership, and arithmetic means
└── components/              DOM helpers, navigation, and notifications
```

Each operation receives the current data and session and checks permissions before changing it. Storage is injected into services so the same rules can be tested with an in-memory implementation in Node.js. Views use DOM nodes and `textContent` for user-provided text.

The data relationships mirror the PHP reference: users connect to projects through teacher and student assignment arrays; projects connect to reusable items through item assignments; grades connect an assigned teacher, assigned student, and project item. Deletions cascade to dependent records.

All role checks are client-side. They improve normal application navigation but cannot protect data from a person who can modify their browser storage.
