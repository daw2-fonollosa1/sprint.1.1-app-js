# Project Decisions

## Browser-only architecture

The JavaScript application is independent from the PHP application. It runs as static files and stores its records in localStorage. There is no database, server-side application logic, or public registration.

## Navigation

The application uses a small hash-based single-page navigation. This keeps the static deployment simple and allows role checks to run before each view is rendered.

## Data model and deletion

Relationships are explicit arrays of assignment records. Removing a user, project, or item cascades through related assignments and grades. Grades are stored individually; means are calculated when displayed and are never saved as a separate value.

## Permissions

Administrators manage users, items, and assignments. Teachers can create projects and are assigned to projects they create; they can edit or delete only projects they created. Teachers can change only their own grades. Students can read only their own project and grade data.

## Referential integrity

Deleting a teacher or student removes their assignments and grade rows. If a deleted teacher created a project, its creator is reassigned to the administrator so the project can remain available. Deleting a project or evaluable item removes dependent assignments and grades. This mirrors the cascading behavior documented in the PHP reference database schema.

## Student progress

The student dashboard reports how many assigned project items have at least one grade. It does not calculate an overall project average because the functional requirement defines the arithmetic mean for teacher grades on each individual item.

## Initial administrator setup

The first visit starts with empty data and offers a one-time form to create the administrator. Once that account exists, the app returns to sign-in and the administrator creates teacher and student accounts. Passwords and role state in a browser-only application do not provide production security.

## Referential integrity and student progress

Deleting a teacher or student removes their assignments and grade rows. If a deleted teacher created a project, its creator is reassigned to the administrator so the project remains available. Deleting a project or evaluable item removes dependent assignments and grades.

The student dashboard reports how many assigned project items have at least one grade. It does not calculate an overall project average because the functional requirement defines the arithmetic mean for teacher grades on each individual item.

## Bootstrap

Bootstrap 5 is loaded from its official CDN, consistent with the PHP reference. An internet connection is needed for Bootstrap styling and responsive components.
