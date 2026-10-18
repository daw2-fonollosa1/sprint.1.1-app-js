# Project Decisions

## Browser-only architecture

The JavaScript application is independent from the PHP application. It runs as static files and stores its records in localStorage. There is no database, server-side application logic, or public registration.

## Navigation

The application uses a small hash-based single-page navigation. This keeps the static deployment simple and allows role checks to run before each view is rendered.

## Data model and deletion

Relationships are explicit arrays of assignment records. Removing a user, project, or item cascades through related assignments and grades. Grades are stored individually; means are calculated when displayed and are never saved as a separate value.

## Permissions

Administrators manage users, items, and assignments. Teachers can create projects and are assigned to projects they create; they can edit or delete only projects they created. Teachers can change only their own grades. Students can read only their own project and grade data.

## Demo authentication

Five local accounts mirror the PHP reference. They are demonstration identities with a shared sample password, not production credentials. Passwords and role state in a browser-only application do not provide production security.

## Bootstrap

Bootstrap 5 is loaded from its official CDN, consistent with the PHP reference. An internet connection is needed for Bootstrap styling and responsive components.
