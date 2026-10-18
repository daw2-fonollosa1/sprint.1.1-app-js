# Project Requirements

## Functional requirements

The application supports administrator, teacher, and student accounts. The first visit allows one administrator account to be created; after setup, there is no public registration. Users sign in with a username or email and are sent to the dashboard for their role.

Administrators manage teacher and student accounts, projects, reusable evaluable items, and all project assignments. Teachers can create projects, see projects to which they are assigned, and enter or edit their own grades for assigned students and project items. Students see only their projects, items, and grades.

Projects and evaluable items have unique codes, names, and descriptions. A project may have many teachers, students, and evaluable items. An item may be reused across projects. Grades range from 0 to 10 and identify the project, student, item, and teacher. When multiple teachers grade the same student and item in a project, the displayed grade is their arithmetic mean. Missing grades remain pending and do not count as zero.

The administrator dashboard reports current totals for all users (including the administrator), teachers, students, projects, evaluable items, assignment relationships, and individual grade records. Dashboards and tables are derived from the current browser data.

## Roles and permissions

| Action | Administrator | Teacher | Student |
| --- | --- | --- | --- |
| Manage teacher and student accounts | Yes | No | No |
| Create projects | Yes | Yes | No |
| Edit or delete projects | Any project | Projects they created | No |
| Manage evaluable items | Yes | No | No |
| Assign users and items to projects | Yes | No | No |
| View project workspace | All projects | Assigned projects and own projects | Assigned projects |
| Create or edit grades | No | Own grades in assigned projects | No |
| View grades | All records | Assigned projects | Own records only |

Project creators are automatically assigned as teachers so a teacher-created project is immediately usable. Deleting a user removes their assignments and grades; deleting a project or evaluable item removes dependent assignments and grades. These cascades preserve referential integrity in the client data.

## Data relationships

- Users have one role: `administrator`, `teacher`, or `student`.
- `teacherAssignments` link teachers and projects.
- `studentAssignments` link students and projects.
- `itemAssignments` link reusable items and projects.
- A grade references exactly one project, student, item, and teacher, and is valid only while all three assignment relationships exist.
- A teacher can have one grade per student, project, and item. Grades from different teachers are separate rows.

## Technical requirements

- HTML5, CSS3, modern Vanilla JavaScript, and ES Modules.
- Bootstrap 5 for layout and accessible UI components.
- All business rules run in the browser; all persistent application data uses localStorage.
- Node.js built-in test runner verifies pure application logic.
- Docker Compose serves the static frontend through Nginx without a database container.
- GitHub Actions runs the automated tests.
- User-visible text is Catalan; source code and project documentation are English.

## Limitations

This is an educational browser-only application. Client-side roles and localStorage can be changed by a user through browser developer tools. Saved data is not appropriate for sensitive information.
