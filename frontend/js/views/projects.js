import { button, element, fieldGroup } from "../components/dom.js";
import { listProjects, getProjectDetails } from "../modules/projects.js";
import { card, formCard, link, pageHeading, tableCard, roleName } from "./common.js";

export function renderProjects(data, session, user, selectedProjectId, editingProjectId, handlers) {
    const projects = listProjects(data, session);
    const selectedProject = selectedProjectId && projects.some((project) => project.id === selectedProjectId)
        ? getProjectDetails(data, session, selectedProjectId)
        : null;
    const editable = user.role === "administrator" || user.role === "teacher";
    const editingProject = projects.find((project) => project.id === editingProjectId && canEditProject(project, user)) ?? null;
    const fields = [
        fieldGroup({ id: "code", label: "Codi del projecte", value: editingProject?.code ?? "", required: true, placeholder: "PRJ-004" }),
        fieldGroup({ id: "name", label: "Nom del projecte", value: editingProject?.name ?? "", required: true, placeholder: "Nom del projecte" }),
        fieldGroup({ id: "description", label: "Descripció", value: editingProject?.description ?? "", required: true, placeholder: "Descriu el projecte" }),
    ];
    const projectForm = editable ? formCard({
        title: editingProject ? "Edita el projecte" : "Crea un projecte",
        description: editingProject ? "Actualitza la informació del projecte seleccionat." : user.role === "teacher" ? "El teu compte s’assignarà automàticament al projecte." : "Afegeix un projecte a l’aplicació.",
        fields,
        submitLabel: editingProject ? "Desa els canvis" : "Crea el projecte",
        cancelButton: editingProject ? button("Cancel·la", "btn btn-outline-secondary", handlers.onCancelEdit) : null,
        onSubmit: (values) => editingProject ? handlers.onUpdateProject(editingProject.id, values) : handlers.onCreateProject(values),
    }) : null;

    const projectRows = projects.map((project) => {
        const actions = [link("Detalls", `#projects?projectId=${encodeURIComponent(project.id)}`, "btn btn-sm btn-outline-secondary")];
        if (canEditProject(project, user)) {
            actions.push(button("Edita", "btn btn-sm btn-outline-primary", () => handlers.onEditProject(project.id)));
            actions.push(button("Elimina", "btn btn-sm btn-outline-danger", () => handlers.onDeleteProject(project.id)));
        }
        return [
            element("span", { className: "fw-semibold", text: project.code }),
            element("span", {}, [project.name, element("span", { className: "small text-secondary d-block", text: project.description })]),
            String(data.studentAssignments.filter((row) => row.projectId === project.id).length),
            String(data.itemAssignments.filter((row) => row.projectId === project.id).length),
            element("div", { className: "d-flex flex-wrap gap-2" }, actions),
        ];
    });

    const sections = [pageHeading(roleName(user.role), "Projectes", projectDescription(user.role))];
    if (selectedProject) sections.push(renderProjectDetails(selectedProject, user));
    sections.push(element("div", { className: "row g-4 align-items-start" }, [
        projectForm ? element("div", { className: "col-12 col-xl-4" }, projectForm) : null,
        element("div", { className: projectForm ? "col-12 col-xl-8" : "col-12" }, tableCard("Projectes disponibles", "Els projectes que pots consultar amb el teu compte.", ["Codi", "Projecte", "Alumnat", "Ítems", "Accions"], projectRows, "No tens cap projecte assignat.")),
    ]));
    return element("section", {}, sections);
}

function renderProjectDetails(project, user) {
    const itemList = project.items.length
        ? element("ul", { className: "list-group list-group-flush" }, project.items.map((item) => element("li", { className: "list-group-item px-0" }, [
            element("span", { className: "fw-semibold", text: `${item.code} · ${item.name}` }),
            element("span", { className: "small text-secondary d-block", text: item.description }),
        ])))
        : element("p", { className: "text-secondary mb-0", text: "Aquest projecte encara no té ítems avaluables." });
    const details = [
        card("Informació general", "Detalls del projecte assignat.", element("dl", { className: "mb-0" }, [
            element("dt", { text: "Codi del projecte" }), element("dd", { text: project.code }),
            element("dt", { text: "Nom del projecte" }), element("dd", { text: project.name }),
            element("dt", { text: "Descripció" }), element("dd", { className: "mb-0", text: project.description }),
        ])),
        card("Ítems avaluables", `${project.items.length} ítems associats.`, itemList),
    ];
    if (user.role !== "student") {
        const students = project.students.length
            ? element("ul", { className: "list-group list-group-flush" }, project.students.map((student) => element("li", { className: "list-group-item px-0 d-flex justify-content-between gap-2" }, [
                element("span", { text: student.fullName }),
                user.role === "teacher" && project.items[0]
                    ? link("Qualifica", `#grades?projectId=${encodeURIComponent(project.id)}&studentId=${encodeURIComponent(student.id)}&itemId=${encodeURIComponent(project.items[0].id)}`, "btn btn-sm btn-outline-primary")
                    : null,
            ])))
            : element("p", { className: "text-secondary mb-0", text: "Encara no hi ha alumnat assignat." });
        details.push(card("Alumnat assignat", `${project.students.length} alumnes.`, students));
    }
    const actions = [link("Torna als projectes", "#projects", "btn btn-outline-secondary")];
    if (user.role === "teacher") actions.push(link("Obri qualificacions", `#grades?projectId=${encodeURIComponent(project.id)}`, "btn btn-primary"));
    if (user.role === "student") actions.push(link("Consulta les qualificacions", `#grades?projectId=${encodeURIComponent(project.id)}`, "btn btn-primary"));
    return element("section", { className: "mb-4" }, [
        pageHeading(project.code, project.name, "Detalls del projecte assignat.", actions),
        element("div", { className: "row g-4" }, details.map((detail) => element("div", { className: "col-12 col-lg-6" }, detail))),
    ]);
}

function canEditProject(project, user) {
    return user.role === "administrator" || (user.role === "teacher" && project.createdBy === user.id);
}

function projectDescription(role) {
    if (role === "administrator") return "Administra els projectes i revisa les assignacions.";
    if (role === "teacher") return "Consulta els teus projectes assignats i gestiona els que has creat.";
    return "Consulta la informació dels projectes que tens assignats.";
}
