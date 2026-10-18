import { element } from "./components/dom.js";
import { getNavigationItems, createApplicationLayout } from "./components/navigation.js";
import { showNotification } from "./components/notifications.js";
import { createStorage } from "./modules/storage.js";
import { login, getCurrentUser, logout } from "./modules/auth.js";
import { createUser, updateUser, deleteUser } from "./modules/users.js";
import { createProject, updateProject, deleteProject } from "./modules/projects.js";
import { createItem, updateItem, deleteItem } from "./modules/evaluable-items.js";
import { assignTeacher, removeTeacherAssignment, assignStudent, removeStudentAssignment, assignItem, removeItemAssignment } from "./modules/assignments.js";
import { createGrade, updateOwnGrade } from "./modules/grades.js";
import { createLoginView } from "./views/login.js";
import { renderAdminDashboard, renderAdminUsers } from "./views/admin.js";
import { renderAdminItems, renderAdminAssignments, renderAdminGrades, renderAdminSettings } from "./views/admin-management.js";
import { renderProjects } from "./views/projects.js";
import { renderTeacherDashboard, renderTeacherGrades } from "./views/teacher.js";
import { renderStudentDashboard, renderStudentGrades } from "./views/student.js";

const appRoot = document.querySelector("#app");
let storage;
let data;
let startupError = "";
let loginError = "";
let notification = null;
let editingUserId = null;
let editingProjectId = null;
let editingItemId = null;
let editingGradeId = null;

try {
    storage = createStorage();
    data = storage.initialize();
} catch (error) {
    startupError = error.message || "No s’han pogut carregar les dades locals.";
}

if (appRoot) {
    window.addEventListener("hashchange", render);
    window.addEventListener("storage", handleStorageChange);
    render();
}

function render() {
    if (!appRoot) return;
    if (startupError) {
        appRoot.replaceChildren(errorScreen(startupError));
        return;
    }

    try {
        data = storage.readData();
        const current = getCurrentUser(data, storage);
        if (!current) {
            appRoot.replaceChildren(createLoginView({ onSubmit: handleLogin, error: loginError }));
            return;
        }

        const route = readRoute();
        const allowedViews = new Set(getNavigationItems(current.user.role).map((item) => item.view));
        if (!allowedViews.has(route.view)) {
            setRoute("dashboard");
            route.view = "dashboard";
            route.params = {};
        }
        if (route.view !== "users") editingUserId = null;
        if (route.view !== "projects") editingProjectId = null;
        if (route.view !== "items") editingItemId = null;
        if (route.view !== "grades") editingGradeId = null;

        const content = renderPage(current.user, current.session, route);
        createApplicationLayout(appRoot, current.user, route.view, content, handleLogout);
        if (notification) {
            const region = appRoot.querySelector("#notification-region");
            showNotification(region, notification.message, notification.kind);
            notification = null;
        }
    } catch (error) {
        appRoot.replaceChildren(errorScreen(error.message || "S’ha produït un error en carregar la pàgina."));
    }
}

function renderPage(user, session, route) {
    if (user.role === "administrator") {
        if (route.view === "dashboard") return renderAdminDashboard(data);
        if (route.view === "users") return renderAdminUsers(data, session, editingUserId, userHandlers(session));
        if (route.view === "projects") return renderProjects(data, session, user, route.params.projectId, editingProjectId, projectHandlers(session));
        if (route.view === "items") return renderAdminItems(data, session, editingItemId, itemHandlers(session));
        if (route.view === "assignments") return renderAdminAssignments(data, assignmentHandlers(session));
        if (route.view === "grades") return renderAdminGrades(data, session);
        if (route.view === "settings") return renderAdminSettings(resetDemonstrationData);
    }
    if (user.role === "teacher") {
        if (route.view === "dashboard") return renderTeacherDashboard(data, session);
        if (route.view === "projects") return renderProjects(data, session, user, route.params.projectId, editingProjectId, projectHandlers(session));
        if (route.view === "grades") return renderTeacherGrades(data, session, route.params, editingGradeId, gradeHandlers(session));
    }
    if (user.role === "student") {
        if (route.view === "dashboard") return renderStudentDashboard(data, session);
        if (route.view === "projects") return renderProjects(data, session, user, route.params.projectId, null, {});
        if (route.view === "grades") return renderStudentGrades(data, session, route.params.projectId, { onFilterProject: filterStudentGrades });
    }
    return element("div", { className: "alert alert-warning", text: "No s’ha trobat aquesta secció.", attributes: { role: "status" } });
}

function handleLogin(credentials) {
    try {
        data = storage.readData();
        login(data, storage, credentials);
        loginError = "";
        notification = { message: "Has iniciat la sessió correctament.", kind: "success" };
        setRoute("dashboard");
        render();
    } catch (error) {
        loginError = error.message || "No s’ha pogut iniciar la sessió.";
        render();
    }
}

function handleLogout() {
    try {
        logout(storage);
        loginError = "";
        notification = null;
        setRoute("login");
        render();
    } catch (error) {
        notification = { message: error.message, kind: "error" };
        render();
    }
}

function runMutation(operation, successMessage, afterSuccess = null) {
    try {
        const updatedData = storage.readData();
        const result = operation(updatedData);
        storage.writeData(updatedData);
        data = updatedData;
        if (afterSuccess) afterSuccess(result, updatedData);
        notification = { message: successMessage, kind: "success" };
    } catch (error) {
        notification = { message: error.message || "No s’han pogut desar els canvis.", kind: "error" };
    }
    render();
}

function userHandlers(session) {
    return {
        onCreateUser: (values) => runMutation((updatedData) => createUser(updatedData, session, values), "El compte s’ha creat correctament."),
        onUpdateUser: (userId, values) => runMutation((updatedData) => updateUser(updatedData, session, userId, values), "Les dades del compte s’han actualitzat.", () => { editingUserId = null; }),
        onEditUser: (userId) => { editingUserId = userId; render(); },
        onCancelEdit: () => { editingUserId = null; render(); },
        onDeleteUser: (userId) => {
            if (!window.confirm("Vols eliminar aquest compte? També s’eliminaran les assignacions i qualificacions relacionades.")) return;
            runMutation((updatedData) => deleteUser(updatedData, session, userId), "El compte i les dades relacionades s’han eliminat.");
        },
    };
}

function projectHandlers(session) {
    return {
        onCreateProject: (values) => runMutation((updatedData) => createProject(updatedData, session, values), "El projecte s’ha creat correctament."),
        onUpdateProject: (projectId, values) => runMutation((updatedData) => updateProject(updatedData, session, projectId, values), "El projecte s’ha actualitzat.", () => { editingProjectId = null; }),
        onEditProject: (projectId) => { editingProjectId = projectId; render(); },
        onCancelEdit: () => { editingProjectId = null; render(); },
        onDeleteProject: (projectId) => {
            if (!window.confirm("Vols eliminar aquest projecte? També s’eliminaran les assignacions i qualificacions relacionades.")) return;
            runMutation((updatedData) => deleteProject(updatedData, session, projectId), "El projecte i les dades relacionades s’han eliminat.");
        },
    };
}

function itemHandlers(session) {
    return {
        onCreateItem: (values) => runMutation((updatedData) => createItem(updatedData, session, values), "L’ítem avaluable s’ha creat correctament."),
        onUpdateItem: (itemId, values) => runMutation((updatedData) => updateItem(updatedData, session, itemId, values), "L’ítem avaluable s’ha actualitzat.", () => { editingItemId = null; }),
        onEditItem: (itemId) => { editingItemId = itemId; render(); },
        onCancelEdit: () => { editingItemId = null; render(); },
        onDeleteItem: (itemId) => {
            if (!window.confirm("Vols eliminar aquest ítem? També s’eliminaran les seues assignacions i qualificacions.")) return;
            runMutation((updatedData) => deleteItem(updatedData, session, itemId), "L’ítem i les dades relacionades s’han eliminat.");
        },
    };
}

function assignmentHandlers(session) {
    const confirmRemoval = (description, action) => {
        if (!window.confirm(`${description} Les qualificacions relacionades també s’eliminaran.`)) return;
        runMutation(action, "L’assignació s’ha eliminat.");
    };
    return {
        onAssignTeacher: (values) => runMutation((updatedData) => assignTeacher(updatedData, session, values.teacherId, values.projectId), "El professor s’ha assignat al projecte."),
        onRemoveTeacher: (teacherId, projectId) => confirmRemoval("Vols treure aquest professor del projecte?", (updatedData) => removeTeacherAssignment(updatedData, session, teacherId, projectId)),
        onAssignStudent: (values) => runMutation((updatedData) => assignStudent(updatedData, session, values.studentId, values.projectId), "L’alumne s’ha assignat al projecte."),
        onRemoveStudent: (studentId, projectId) => confirmRemoval("Vols treure aquest alumne del projecte?", (updatedData) => removeStudentAssignment(updatedData, session, studentId, projectId)),
        onAssignItem: (values) => runMutation((updatedData) => assignItem(updatedData, session, values.itemId, values.projectId), "L’ítem s’ha associat al projecte."),
        onRemoveItem: (itemId, projectId) => confirmRemoval("Vols treure aquest ítem del projecte?", (updatedData) => removeItemAssignment(updatedData, session, itemId, projectId)),
    };
}

function gradeHandlers(session) {
    return {
        onCreateGrade: (values) => runMutation((updatedData) => createGrade(updatedData, session, values), "La qualificació s’ha desat correctament."),
        onUpdateGrade: (gradeId, value) => runMutation((updatedData) => updateOwnGrade(updatedData, session, gradeId, value), "La qualificació s’ha actualitzat.", () => { editingGradeId = null; }),
        onEditGrade: (gradeId) => { editingGradeId = gradeId; render(); },
        onCancelEdit: () => { editingGradeId = null; render(); },
        onSelectProject: (projectId) => { setRoute(`grades?projectId=${encodeURIComponent(projectId)}`); },
    };
}

function filterStudentGrades(projectId) {
    setRoute(projectId ? `grades?projectId=${encodeURIComponent(projectId)}` : "grades");
}

function resetDemonstrationData() {
    if (!window.confirm("Vols restablir les dades de demostració? Se sobreescriuran tots els canvis locals.")) return;
    try {
        data = storage.resetDemoData(true);
        notification = { message: "Les dades de demostració s’han restablert.", kind: "success" };
        loginError = "";
        setRoute("login");
        render();
    } catch (error) {
        notification = { message: error.message, kind: "error" };
        render();
    }
}

function readRoute() {
    const [view = "dashboard", query = ""] = window.location.hash.slice(1).split("?");
    return { view, params: Object.fromEntries(new URLSearchParams(query).entries()) };
}

function setRoute(route) {
    const normalized = route.startsWith("#") ? route : `#${route}`;
    if (window.location.hash === normalized) render();
    else window.location.hash = normalized;
}

function handleStorageChange(event) {
    if (event.key === null || event.key?.startsWith("daw2ProjectManager:")) {
        try {
            data = storage.readData();
            render();
        } catch (error) {
            startupError = error.message;
            render();
        }
    }
}

function errorScreen(message) {
    return element("main", { className: "container py-5" }, element("div", { className: "alert alert-danger", attributes: { role: "alert" } }, [
        element("h1", { className: "h4", text: "No s’ha pogut carregar l’aplicació" }),
        element("p", { className: "mb-0", text: message }),
    ]));
}
