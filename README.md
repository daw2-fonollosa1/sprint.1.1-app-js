# DAW2 Project Manager (JavaScript)

An educational project management application for DAW2 Sprint 1.1. The browser version reproduces the user roles and main workflows of the neighboring PHP reference while using HTML, CSS, Vanilla JavaScript, ES Modules, Bootstrap 5, and browser `localStorage`.

## Features

- Demonstration sign-in for one administrator, teachers, and students; no public registration.
- Administrator screens for users, projects, evaluable items, project assignments, grades, and demonstration data reset.
- Teacher screens for assigned projects, project details, students, items, and grade creation or editing.
- Student screens for assigned projects, progress, individual teacher grades, and the arithmetic mean for each item.
- Persistent local data, referential integrity checks, duplicate prevention, and confirmation before destructive actions.
- Responsive Bootstrap 5 navigation and tables.

## Technologies

- HTML5 and CSS3.
- Vanilla JavaScript with ES Modules.
- Bootstrap 5.3 loaded from jsDelivr.
- Browser `localStorage` for all persistent data and demonstration session state.
- Node.js built-in test runner, GitHub Actions, Docker Compose, and Nginx.

The app has no application backend, database, or external authentication service. Node.js is used only for the test runner; Python's static server is used for local preview.

## Project structure

```text
frontend/
├── index.html
├── css/styles.css
└── js/
    ├── app.js
    ├── components/       DOM, navigation, and notifications
    ├── modules/          storage, authentication, business rules, and demo data
    └── views/            shared pages and administrator/teacher/student screens
tests/                    Node.js unit tests and in-memory storage adapter
docs/                     requirements, architecture, decisions, and testing
.github/workflows/        automated test workflow
Dockerfile                static Nginx image
compose.yaml              local static web service
```

## Run locally

Use Node.js 22.8 or newer and Python 3. From the repository root:

```bash
npm ci
npm run serve
```

Open <http://127.0.0.1:8080/>. The local server serves only the static `frontend/` directory. Bootstrap styling and its mobile navigation component load from the CDN, so an internet connection is needed for the full appearance.

## Run with Docker Compose

Docker Compose builds one lightweight Nginx static web container. There is no database container.

```bash
docker compose up --build -d
```

Open <http://127.0.0.1:8080/>. Stop and remove the container with:

```bash
docker compose down
```

The application records stay in the browser's localStorage, not in Docker.

## Run automated tests

```bash
npm test
```

The tests use Node.js's built-in test runner and an in-memory storage adapter. They cover initialization and persistence, user/project/item CRUD, assignments, authorization, login/logout, referential integrity, grade ownership, and multiple-teacher averages. GitHub Actions runs the same suite on pushes and pull requests.

## Demonstration accounts

All demonstration accounts use the password `12345`.

| Role | Username | Email |
| --- | --- | --- |
| Administrator | `admin-demo` | `admin@daw2.test` |
| Teacher | `teacher-marta` | `marta@daw2.test` |
| Teacher | `teacher-joan` | `joan@daw2.test` |
| Student | `student-marc` | `marc@daw2.test` |
| Student | `student-laura` | `laura@daw2.test` |

These are local demo identities only. Do not enter real account information or use real passwords.

## Data and grading decisions

On first load, the application writes the PHP reference's sample users, projects, items, assignments, and grades to localStorage. Later loads preserve saved changes. Records include a schema version and are checked for duplicate IDs, invalid relationships, and invalid grades. Corrupted or unsupported saved data produces an error instead of silently replacing existing data.

Deleting a teacher or student removes their project assignments and their associated grade rows. A teacher-created project is reassigned to the administrator if that teacher is deleted. Deleting a project or item removes its assignment links and related grades. These rules keep stored relationships valid.

Grades are stored separately for each teacher, student, project, and item. The displayed item average is the arithmetic mean of the available teacher grades; missing grades remain pending. Student progress is a count of assigned project items that have at least one grade. The application does not calculate a separate overall project grade.

The administrator can restore the original demonstration data from **Dades de demostració**. This requires confirmation and replaces the local data for the current browser origin.

## Git workflow

Development for this repository uses one dedicated branch, `sprint-1-1-javascript`, with descriptive Conventional Commit messages as features are completed. Changes are committed locally in meaningful stages. This JavaScript repository does not require GitHub Issues, project boards, per-feature branches, or individual pull requests.

## Known limitations

- localStorage is local to one browser and origin. It does not synchronize across users or devices and can be changed or cleared through browser tools.
- Authentication and role checks run entirely in JavaScript. Demo passwords are stored in browser data; this is not production authentication and does not protect sensitive information.
- The app is intended for coursework and demonstration data only.
- Bootstrap is loaded from a public CDN, so its styling is unavailable without internet access.
- Browser-level automated tests are not included; automated checks focus on business logic. No WebDriver or browser automation package was available in the development environment, and Firefox failed to start headlessly with the system profile.
