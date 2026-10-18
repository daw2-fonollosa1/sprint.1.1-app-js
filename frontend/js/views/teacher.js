import { button, element, fieldGroup, selectGroup } from "../components/dom.js";
import { listProjects } from "../modules/projects.js";
import { getGradesForTeacher } from "../modules/grades.js";
import { formatGrade, formCard, pageHeading, statCard, tableCard, link } from "./common.js";

export function renderTeacherDashboard(data, session) {
    const user = data.users.find((entry) => entry.id === session.userId);
    const projects = listProjects(data, session);
    const projectIds = new Set(projects.map((project) => project.id));
    const studentIds = new Set(data.studentAssignments.filter((row) => projectIds.has(row.projectId)).map((row) => row.studentId));
    const ownGrades = data.grades.filter((grade) => grade.teacherId === user.id && projectIds.has(grade.projectId));
    let pendingCount = 0;
    for (const project of projects) {
        const students = data.studentAssignments.filter((row) => row.projectId === project.id).map((row) => row.studentId);
        const items = data.itemAssignments.filter((row) => row.projectId === project.id).map((row) => row.itemId);
        for (const studentId of students) {
            for (const itemId of items) {
                if (!ownGrades.some((grade) => grade.projectId === project.id && grade.studentId === studentId && grade.itemId === itemId)) pendingCount += 1;
            }
        }
    }

    const projectRows = projects.map((project) => [
        element("span", {}, [element("span", { className: "fw-semibold", text: project.name }), element("span", { className: "small text-secondary d-block", text: project.code })]),
        String(data.studentAssignments.filter((row) => row.projectId === project.id).length),
        String(data.itemAssignments.filter((row) => row.projectId === project.id).length),
        element("div", { className: "d-flex flex-wrap gap-2" }, [
            link("Detalls", `#projects?projectId=${encodeURIComponent(project.id)}`, "btn btn-sm btn-outline-secondary"),
            link("Qualifica", `#grades?projectId=${encodeURIComponent(project.id)}`, "btn btn-sm btn-primary"),
        ]),
    ]);

    return element("section", {}, [
        pageHeading("Mòdul docent", "Tauler del professorat", "Resum dels projectes i de l’alumnat que tens assignats."),
        element("div", { className: "row g-3 mb-4" }, [
            statCard("Projectes assignats", projects.length),
            statCard("Alumnes", studentIds.size, "Als projectes assignats"),
            statCard("Notes introduïdes per tu", ownGrades.length),
            statCard("Qualificacions pendents", pendingCount, "Ítems pendents de la teua nota"),
        ].map((item) => element("div", { className: "col-12 col-sm-6 col-xl-3" }, item))),
        tableCard("Projectes assignats", "Només es mostren els projectes del teu compte.", ["Projecte", "Alumnes", "Ítems", "Accions"], projectRows, "No tens projectes assignats."),
    ]);
}

export function renderTeacherGrades(data, session, query, editingGradeId, handlers) {
    const user = data.users.find((entry) => entry.id === session.userId);
    const projects = listProjects(data, session);
    const selectedProject = projects.find((project) => project.id === query.projectId) ?? projects[0] ?? null;
    const students = selectedProject
        ? data.studentAssignments.filter((row) => row.projectId === selectedProject.id).map((row) => data.users.find((entry) => entry.id === row.studentId))
        : [];
    const items = selectedProject
        ? data.itemAssignments.filter((row) => row.projectId === selectedProject.id).map((row) => data.items.find((entry) => entry.id === row.itemId))
        : [];
    const editingGrade = data.grades.find((grade) => grade.id === editingGradeId && grade.teacherId === user.id) ?? null;
    const rows = selectedProject ? getGradesForTeacher(data, session, selectedProject.id).map((grade) => [
        grade.student.fullName,
        `${grade.item.code} · ${grade.item.name}`,
        grade.teacher.fullName,
        formatGrade(grade.value),
        formatGrade(grade.average),
        grade.teacherId === user.id ? button("Edita la meua nota", "btn btn-sm btn-outline-primary", () => handlers.onEditGrade(grade.id)) : element("span", { className: "small text-secondary", text: "" }),
    ]) : [];

    let gradeForm = null;
    if (editingGrade) {
        const project = data.projects.find((entry) => entry.id === editingGrade.projectId);
        const student = data.users.find((entry) => entry.id === editingGrade.studentId);
        const item = data.items.find((entry) => entry.id === editingGrade.itemId);
        gradeForm = formCard({
            title: "Edita la teua qualificació",
            description: `${project?.code ?? ""} · ${student?.fullName ?? ""} · ${item?.name ?? ""}`,
            fields: [fieldGroup({ id: "value", label: "Nota (de 0 a 10)", type: "number", value: String(editingGrade.value), required: true, min: 0, max: 10, step: "any", inputMode: "decimal" })],
            submitLabel: "Desa la nota",
            cancelButton: button("Cancel·la", "btn btn-outline-secondary", handlers.onCancelEdit),
            onSubmit: (values) => handlers.onUpdateGrade(editingGrade.id, values.value),
        });
    } else if (selectedProject && students.length > 0 && items.length > 0) {
        const projectField = selectGroup({ id: "projectId", label: "Projecte", options: projects.map((project) => ({ value: project.id, label: `${project.code} · ${project.name}` })), value: selectedProject.id, required: true });
        projectField.querySelector("select").addEventListener("change", (event) => handlers.onSelectProject(event.currentTarget.value));
        gradeForm = formCard({
            title: "Introdueix una qualificació",
            description: "Només pots qualificar alumnat i ítems del projecte seleccionat.",
            fields: [
                projectField,
                selectGroup({ id: "studentId", label: "Alumne", options: students.map((student) => ({ value: student.id, label: student.fullName })), value: query.studentId, emptyLabel: "Tria un alumne", required: true }),
                selectGroup({ id: "itemId", label: "Ítem avaluable", options: items.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })), value: query.itemId, emptyLabel: "Tria un ítem", required: true }),
                fieldGroup({ id: "value", label: "Nota (de 0 a 10)", type: "number", required: true, min: 0, max: 10, step: "any", inputMode: "decimal", placeholder: "8.5" }),
            ],
            submitLabel: "Desa la qualificació",
            onSubmit: handlers.onCreateGrade,
        });
    }

    return element("section", {}, [
        pageHeading("Mòdul docent", "Qualificacions", "Introdueix i revisa les notes dels projectes que tens assignats."),
        !projects.length ? element("div", { className: "alert alert-info", text: "No tens projectes assignats per qualificar.", attributes: { role: "status" } }) : null,
        selectedProject && (!students.length || !items.length) ? element("div", { className: "alert alert-info", text: "Aquest projecte necessita alumnat i ítems assignats abans de poder qualificar.", attributes: { role: "status" } }) : null,
        gradeForm,
        selectedProject ? tableCard(`Notes de ${selectedProject.code}`, "Les notes de cada docent es mostren separadament; la mitjana s’actualitza automàticament.", ["Alumne", "Ítem", "Docent", "Nota", "Mitjana", "Acció"], rows, "Encara no hi ha qualificacions per a aquest projecte.") : null,
    ]);
}
