import { button, element, fieldGroup, selectGroup } from "../components/dom.js";
import { listItems } from "../modules/evaluable-items.js";
import { getGradesForAdministrator } from "../modules/grades.js";
import { pageHeading, formCard, tableCard, formatGrade } from "./common.js";

export function renderAdminItems(data, session, editingItemId, handlers) {
    const editingItem = data.items.find((item) => item.id === editingItemId) ?? null;
    const fields = [
        fieldGroup({ id: "code", label: "Codi de l’ítem", value: editingItem?.code ?? "", required: true, placeholder: "IT-003" }),
        fieldGroup({ id: "name", label: "Nom de l’ítem", value: editingItem?.name ?? "", required: true, placeholder: "Nom de l’ítem" }),
        fieldGroup({ id: "description", label: "Descripció", value: editingItem?.description ?? "", required: true, placeholder: "Descriu què s’avalua" }),
    ];
    const form = formCard({
        title: editingItem ? "Edita l’ítem" : "Crea un ítem avaluable",
        description: "Els ítems es poden reutilitzar en diversos projectes.",
        fields,
        submitLabel: editingItem ? "Desa els canvis" : "Crea l’ítem",
        cancelButton: editingItem ? button("Cancel·la", "btn btn-outline-secondary", handlers.onCancelEdit) : null,
        onSubmit: (values) => editingItem ? handlers.onUpdateItem(editingItem.id, values) : handlers.onCreateItem(values),
    });
    const rows = listItems(data, session).map((item) => [
        element("span", { className: "fw-semibold", text: item.code }),
        element("span", {}, [item.name, element("span", { className: "small text-secondary d-block", text: item.description })]),
        String(data.itemAssignments.filter((row) => row.itemId === item.id).length),
        element("div", { className: "d-flex gap-2" }, [
            button("Edita", "btn btn-sm btn-outline-primary", () => handlers.onEditItem(item.id)),
            button("Elimina", "btn btn-sm btn-outline-danger", () => handlers.onDeleteItem(item.id)),
        ]),
    ]);
    return element("section", {}, [
        pageHeading("Administració", "Ítems avaluables", "Gestiona els criteris d’avaluació que es poden associar als projectes."),
        element("div", { className: "row g-4 align-items-start" }, [
            element("div", { className: "col-12 col-xl-4" }, form),
            element("div", { className: "col-12 col-xl-8" }, tableCard("Ítems disponibles", "Cada codi identifica un ítem únic.", ["Codi", "Ítem", "Projectes", "Accions"], rows, "Encara no hi ha ítems avaluables.")),
        ]),
    ]);
}

export function renderAdminAssignments(data, handlers) {
    const teachers = data.users.filter((user) => user.role === "teacher");
    const students = data.users.filter((user) => user.role === "student");
    const projects = data.projects.map((project) => ({ value: project.id, label: `${project.code} · ${project.name}` }));
    const items = data.items.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` }));

    const teacherBlock = assignmentBlock({
        title: "Professorat i projectes",
        description: "Un projecte pot tenir diversos docents.",
        formTitle: "Assigna professorat",
        fields: [
            selectGroup({ id: "teacherId", label: "Professorat", options: teachers.map((user) => ({ value: user.id, label: user.fullName })), emptyLabel: "Tria un compte", required: true }),
            selectGroup({ id: "projectId", label: "Projecte", options: projects, emptyLabel: "Tria un projecte", required: true }),
        ],
        assignments: data.teacherAssignments.map((row) => ({ id: row.id, person: data.users.find((user) => user.id === row.teacherId), project: data.projects.find((project) => project.id === row.projectId), remove: () => handlers.onRemoveTeacher(row.teacherId, row.projectId) })),
        personLabel: "Professorat",
        onSubmit: handlers.onAssignTeacher,
    });
    const studentBlock = assignmentBlock({
        title: "Alumnat i projectes",
        description: "Un alumne pot participar en diversos projectes.",
        formTitle: "Assigna alumnat",
        fields: [
            selectGroup({ id: "studentId", label: "Alumnat", options: students.map((user) => ({ value: user.id, label: user.fullName })), emptyLabel: "Tria un compte", required: true }),
            selectGroup({ id: "projectId", label: "Projecte", options: projects, emptyLabel: "Tria un projecte", required: true }),
        ],
        assignments: data.studentAssignments.map((row) => ({ id: row.id, person: data.users.find((user) => user.id === row.studentId), project: data.projects.find((project) => project.id === row.projectId), remove: () => handlers.onRemoveStudent(row.studentId, row.projectId) })),
        personLabel: "Alumnat",
        onSubmit: handlers.onAssignStudent,
    });
    const itemBlock = assignmentBlock({
        title: "Ítems i projectes",
        description: "Els ítems es poden reutilitzar entre projectes.",
        formTitle: "Associa un ítem",
        fields: [
            selectGroup({ id: "itemId", label: "Ítem avaluable", options: items, emptyLabel: "Tria un ítem", required: true }),
            selectGroup({ id: "projectId", label: "Projecte", options: projects, emptyLabel: "Tria un projecte", required: true }),
        ],
        assignments: data.itemAssignments.map((row) => ({ id: row.id, person: data.items.find((item) => item.id === row.itemId), project: data.projects.find((project) => project.id === row.projectId), remove: () => handlers.onRemoveItem(row.itemId, row.projectId) })),
        personLabel: "Ítem",
        onSubmit: handlers.onAssignItem,
    });

    return element("section", {}, [
        pageHeading("Administració", "Assignacions", "Relaciona professorat, alumnat i ítems amb els projectes."),
        teacherBlock,
        studentBlock,
        itemBlock,
    ]);
}

function assignmentBlock({ title, description, formTitle, fields, assignments, personLabel, onSubmit }) {
    const form = formCard({ title: formTitle, fields, submitLabel: "Afegeix l’assignació", onSubmit });
    const rows = assignments.map(({ id, person, project, remove }) => [
        element("span", { className: "fw-semibold", text: person?.fullName ?? `${person?.code ?? ""} · ${person?.name ?? "Ítem eliminat"}` }),
        element("span", {}, [project?.name ?? "Projecte eliminat", element("span", { className: "small text-secondary d-block", text: project?.code ?? "" })]),
        button("Treu", "btn btn-sm btn-outline-danger", remove),
    ]);
    return element("section", { className: "card border-0 shadow-sm mb-4" }, [
        element("div", { className: "card-body p-0" }, [
            element("div", { className: "p-3 p-lg-4 pb-0" }, [element("h2", { className: "h5 mb-1", text: title }), element("p", { className: "small text-secondary mb-0", text: description })]),
            element("div", { className: "row g-4 p-3 p-lg-4 align-items-start" }, [
                element("div", { className: "col-12 col-lg-4" }, form),
                element("div", { className: "col-12 col-lg-8" }, tableCard(`${assignments.length} assignacions`, `${personLabel} relacionat amb cada projecte.`, [personLabel, "Projecte", "Acció"], rows, "Encara no hi ha assignacions.")),
            ]),
        ]),
    ]);
}

export function renderAdminGrades(data, session) {
    const rows = getGradesForAdministrator(data, session).map((grade) => [
        element("span", {}, [grade.project.code, element("span", { className: "small text-secondary d-block", text: grade.project.name })]),
        grade.student.fullName,
        `${grade.item.code} · ${grade.item.name}`,
        grade.teacher.fullName,
        formatGrade(grade.value),
        formatGrade(grade.average),
    ]);
    return element("section", {}, [
        pageHeading("Administració", "Qualificacions", "Consulta les notes individuals i les mitjanes recalculades per ítem."),
        tableCard("Notes registrades", "Les notes dels docents es guarden separadament.", ["Projecte", "Alumne", "Ítem", "Docent", "Nota", "Mitjana"], rows, "Encara no hi ha qualificacions."),
    ]);
}

export function renderAdminSettings(onReset) {
    return element("section", {}, [
        pageHeading("Administració", "Dades de demostració", "Restableix les dades inicials quan vulgues tornar a començar la demostració."),
        element("div", { className: "alert alert-warning", attributes: { role: "note" } }, [
            element("h2", { className: "h5", text: "Restabliment de dades" }),
            element("p", { text: "Aquesta acció reemplaça els canvis desats en aquest navegador pels comptes i projectes de demostració." }),
            button("Restableix les dades de demostració", "btn btn-danger", onReset),
        ]),
    ]);
}
