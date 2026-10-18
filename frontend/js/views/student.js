import { element, selectGroup } from "../components/dom.js";
import { listProjects } from "../modules/projects.js";
import { getGradesForStudent } from "../modules/grades.js";
import { formatGrade, pageHeading, statCard, tableCard, link } from "./common.js";

export function renderStudentDashboard(data, session) {
    const projects = listProjects(data, session);
    const gradeRows = getGradesForStudent(data, session);
    const completedCount = gradeRows.filter((row) => row.average !== null).length;
    const pendingCount = gradeRows.length - completedCount;
    const progress = gradeRows.length ? Math.round((completedCount / gradeRows.length) * 100) : 0;
    const rows = projects.map((project) => {
        const projectGrades = gradeRows.filter((row) => row.project.id === project.id);
        const complete = projectGrades.filter((row) => row.average !== null).length;
        return [
            element("span", {}, [element("span", { className: "fw-semibold", text: project.name }), element("span", { className: "small text-secondary d-block", text: project.code })]),
            String(projectGrades.length),
            `${complete} / ${projectGrades.length}`,
            link("Detalls", `#projects?projectId=${encodeURIComponent(project.id)}`, "btn btn-sm btn-outline-secondary"),
        ];
    });

    return element("section", {}, [
        pageHeading("Mòdul de l’alumnat", "Tauler de l’alumne", "Consulta els projectes assignats i les qualificacions de cada ítem.", [link("Les meues qualificacions", "#grades", "btn btn-primary")]),
        element("div", { className: "row g-3 mb-4" }, [
            statCard("Projectes assignats", projects.length),
            statCard("Ítems qualificats", completedCount, "Amb una o més notes del professorat"),
            statCard("Ítems pendents", pendingCount, "Sense cap nota registrada"),
            statCard("Progrés d’avaluació", `${progress}%`, `${completedCount} de ${gradeRows.length} ítems amb nota`),
        ].map((item) => element("div", { className: "col-12 col-sm-6 col-xl-3" }, item))),
        gradeRows.length ? null : element("div", { className: "alert alert-info", text: "Encara no tens ítems o qualificacions per mostrar.", attributes: { role: "status" } }),
        tableCard("Els meus projectes", "El progrés compta només els ítems dels projectes assignats.", ["Projecte", "Ítems", "Avaluats", "Acció"], rows, "No tens projectes assignats."),
    ]);
}

export function renderStudentGrades(data, session, selectedProjectId, handlers) {
    const projects = listProjects(data, session);
    const allRows = getGradesForStudent(data, session);
    const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
    const visibleRows = selectedProject ? allRows.filter((row) => row.project.id === selectedProject.id) : allRows;
    const filter = selectGroup({
        id: "projectFilter",
        label: "Filtra per projecte",
        options: projects.map((project) => ({ value: project.id, label: `${project.code} · ${project.name}` })),
        value: selectedProject?.id ?? "",
        emptyLabel: "Tots els meus projectes",
    });
    filter.querySelector("select").addEventListener("change", (event) => handlers.onFilterProject(event.currentTarget.value));

    const rows = visibleRows.map((row) => {
        const teacherGrades = row.teacherGrades.length
            ? element("ul", { className: "list-unstyled small mb-0" }, row.teacherGrades.map((grade) => element("li", { text: `${grade.teacher.fullName}: ${formatGrade(grade.value)}` })))
            : element("span", { className: "text-secondary", text: "Pendent" });
        return [
            element("span", {}, [
                element("span", { className: "fw-semibold", text: row.project.name }),
                element("span", { className: "small text-secondary d-block", text: `${row.project.code} · ${row.item.code} · ${row.item.name}` }),
            ]),
            teacherGrades,
            row.average === null
                ? element("span", { className: "badge text-bg-light border", text: "Pendent" })
                : element("span", { className: "fw-semibold", text: formatGrade(row.average) }),
        ];
    });

    return element("section", {}, [
        pageHeading("Mòdul de l’alumnat", "Les meues qualificacions", "Les notes es mostren per projecte i ítem avaluable."),
        element("section", { className: "card border-0 shadow-sm mb-4" }, element("div", { className: "card-body" }, [
            filter,
            element("p", { className: "small text-secondary mb-0", text: "Les mitjanes són la mitjana aritmètica de les notes introduïdes pels docents. Les notes pendents no compten com a zero." }),
        ])),
        allRows.every((row) => row.average === null) ? element("div", { className: "alert alert-info", text: "Encara no hi ha qualificacions desades per als teus projectes.", attributes: { role: "status" } }) : null,
        tableCard("Resultats per ítem", "Només es mostren les qualificacions del teu compte.", ["Projecte i ítem", "Notes del professorat", "Mitjana aritmètica"], rows, "No hi ha ítems avaluables als projectes assignats."),
    ]);
}
