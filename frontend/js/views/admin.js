import { button, element, fieldGroup, selectGroup } from "../components/dom.js";
import { listUsers } from "../modules/users.js";
import { pageHeading, statCard, tableCard, formCard, roleName, link } from "./common.js";

export function renderAdminDashboard(data) {
    const userCount = data.users.length;
    const teacherCount = data.users.filter((user) => user.role === "teacher").length;
    const studentCount = data.users.filter((user) => user.role === "student").length;
    const assignmentCount = data.teacherAssignments.length + data.studentAssignments.length + data.itemAssignments.length;
    const cards = [
        statCard("Usuaris totals", userCount, "Inclou el compte d’administració"),
        statCard("Professorat", teacherCount),
        statCard("Alumnat", studentCount),
        statCard("Projectes", data.projects.length),
        statCard("Ítems avaluables", data.items.length),
        statCard("Assignacions", assignmentCount, "Relacions entre projectes i comptes o ítems"),
    ];
    const projects = data.projects.map((project) => [
        element("span", { className: "fw-semibold", text: project.code }),
        project.name,
        project.description,
        String(data.teacherAssignments.filter((row) => row.projectId === project.id).length),
        String(data.studentAssignments.filter((row) => row.projectId === project.id).length),
    ]);

    return element("section", {}, [
        pageHeading("Vista d’administració", "Tauler d’administració", "Resum de les dades actuals de l’aplicació.", [link("Gestiona els projectes", "#projects", "btn btn-primary")]),
        element("div", { className: "row g-3 mb-4" }, cards.map((item) => element("div", { className: "col-12 col-sm-6 col-xl-4" }, item))),
        tableCard("Projectes existents", "Llista dels projectes desats al navegador.", ["Codi", "Nom", "Descripció", "Professorat", "Alumnat"], projects, "Encara no hi ha projectes."),
        element("p", { className: "small text-secondary mt-3 mb-0", text: `Qualificacions individuals registrades: ${data.grades.length}.` }),
    ]);
}

export function renderAdminUsers(data, session, editingUserId, handlers) {
    const editingUser = data.users.find((user) => user.id === editingUserId) ?? null;
    const fields = [
        fieldGroup({ id: "fullName", label: "Nom complet", value: editingUser?.fullName ?? "", required: true, placeholder: "Nom i cognoms" }),
        fieldGroup({ id: "username", label: "Nom d’usuari", value: editingUser?.username ?? "", required: true, placeholder: "nom.cognom" }),
        fieldGroup({ id: "email", label: "Correu electrònic", type: "email", value: editingUser?.email ?? "", required: true, placeholder: "nom@centre.cat" }),
        fieldGroup({ id: "password", label: editingUser ? "Nova contrasenya (opcional)" : "Contrasenya", type: "password", required: !editingUser, placeholder: editingUser ? "Deixa-la en blanc per conservar-la" : "Mínim 5 caràcters" }),
    ];
    if (editingUser) {
        fields.push(element("input", { attributes: { type: "hidden", name: "role", value: editingUser.role } }));
        fields.push(element("p", { className: "small text-secondary", text: `Rol del compte: ${roleName(editingUser.role)}. El rol no es pot canviar.` }));
    } else {
        fields.push(selectGroup({ id: "role", label: "Rol", required: true, options: [{ value: "teacher", label: "Professorat" }, { value: "student", label: "Alumnat" }] }));
    }

    const userForm = formCard({
        title: editingUser ? "Edita el compte" : "Crea un compte",
        description: editingUser ? "Actualitza les dades del compte seleccionat." : "Crea un compte de professorat o d’alumnat.",
        fields,
        submitLabel: editingUser ? "Desa els canvis" : "Crea el compte",
        cancelButton: editingUser ? button("Cancel·la", "btn btn-outline-secondary", handlers.onCancelEdit) : null,
        onSubmit: (values) => editingUser ? handlers.onUpdateUser(editingUser.id, values) : handlers.onCreateUser(values),
    });

    const rows = listUsers(data, session).map((user) => {
        const actions = [button("Edita", "btn btn-sm btn-outline-primary", () => handlers.onEditUser(user.id))];
        if (user.role !== "administrator") actions.push(button("Elimina", "btn btn-sm btn-outline-danger", () => handlers.onDeleteUser(user.id)));
        return [
            element("span", { className: "small text-secondary", text: user.id }),
            element("span", { className: "fw-semibold", text: user.fullName }),
            element("span", {}, [user.username, element("span", { className: "small text-secondary d-block", text: user.email })]),
            roleName(user.role),
            element("div", { className: "d-flex gap-2" }, actions),
        ];
    });

    return element("section", {}, [
        pageHeading("Administració", "Gestió d’usuaris", "Crea i actualitza els comptes del professorat i de l’alumnat."),
        element("div", { className: "row g-4 align-items-start" }, [
            element("div", { className: "col-12 col-xl-4" }, userForm),
            element("div", { className: "col-12 col-xl-8" }, tableCard("Comptes existents", "L’administrador únic està protegit contra l’eliminació.", ["Identificador", "Nom", "Accés", "Rol", "Accions"], rows, "Encara no hi ha comptes.")),
        ]),
    ]);
}
