# Architecture

The static entry point is `frontend/index.html`. It loads Bootstrap, the shared stylesheet, and the ES module entry point `frontend/js/app.js`.

```text
app.js
├── modules/storage.js       localStorage serialization, initialization, and schema version
├── modules/auth.js          sign-in, persisted session, and logout
├── modules/users.js         user validation and administrator-only operations
├── modules/projects.js      project CRUD and creator permissions
├── modules/evaluable-items.js reusable item CRUD
├── modules/assignments.js   teacher, student, and item relationships
├── modules/grades.js        grade rules, ownership, and arithmetic means
└── components/              DOM helpers, navigation, and notifications
```

`frontend/js/views/` contains the shared page builders and role-specific administrator, teacher, and student screens. `app.js` reads the hash route, resolves the user from the saved session, checks the role's navigation allowlist, renders a view, and wires user actions to the business services.

`frontend/js/views/` contains the shared page builders and role-specific administrator, teacher, and student screens. `app.js` reads the hash route, resolves the user from the saved session, checks the role's navigation allowlist, renders a view, and wires user actions to the business services.

Each operation receives the current data and session and checks permissions before changing it. Storage is injected into services so the same rules can be tested with an in-memory implementation in Node.js. The production app starts with empty collections and offers a one-time initial administrator setup. Views use DOM nodes and `textContent` for user-provided text.

The data relationships mirror the PHP reference: users connect to projects through teacher and student assignment arrays; projects connect to reusable items through item assignments; grades connect an assigned teacher, assigned student, and project item. Deletions cascade to dependent records.

The student dashboard's progress indicator counts assigned project items with at least one teacher grade. It is not an overall project grade. All role checks are client-side. They improve normal application navigation but cannot protect data from a person who can modify their browser storage.
