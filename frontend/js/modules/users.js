import { createId } from "./storage.js";
import { normalizeText, requireAdministrator, ValidationError } from "./permissions.js";

const editableRoles = new Set(["teacher", "student"]);

function publicUser(user) {
    const { password, ...visibleUser } = user;
    return visibleUser;
}

function normalizedIdentity(value) {
    return value.trim().toLocaleLowerCase("ca");
}

function validateUserFields(data, input, ignoredId = null) {
    const fullName = normalizeText(input.fullName, "el nom");
    const username = normalizeText(input.username, "el nom d’usuari");
    const email = normalizeText(input.email, "el correu electrònic");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError("Introdueix un correu electrònic vàlid.");
    const duplicate = data.users.find((user) => user.id !== ignoredId
        && (normalizedIdentity(user.username) === normalizedIdentity(username)
            || normalizedIdentity(user.email) === normalizedIdentity(email)));
    if (duplicate) throw new ValidationError("Aquest nom d’usuari o correu electrònic ja existeix.");
    return { fullName, username, email };
}

export function listUsers(data, session) {
    requireAdministrator(data, session);
    return data.users.map(({ password, ...user }) => user);
}

export function createUser(data, session, input) {
    input = input ?? {};
    requireAdministrator(data, session);
    if (!editableRoles.has(input.role)) throw new ValidationError("Només es poden crear comptes de professorat o alumnat.");
    const fields = validateUserFields(data, input);
    const password = normalizeText(input.password, "la contrasenya");
    if (password.length < 5) throw new ValidationError("La contrasenya ha de tenir almenys 5 caràcters.");
    const user = { id: createId("user"), ...fields, role: input.role, password };
    data.users.push(user);
    return publicUser(user);
}

export function updateUser(data, session, userId, input) {
    input = input ?? {};
    requireAdministrator(data, session);
    const user = data.users.find((entry) => entry.id === userId);
    if (!user) throw new ValidationError("No s’ha trobat l’usuari.");
    if (input.role && input.role !== user.role) throw new ValidationError("No es pot canviar el rol d’un compte existent.");
    const fields = validateUserFields(data, input, userId);
    const password = typeof input.password === "string" ? input.password.trim() : "";
    if (password && password.length < 5) throw new ValidationError("La contrasenya ha de tenir almenys 5 caràcters.");
    user.fullName = fields.fullName;
    user.username = fields.username;
    user.email = fields.email;
    if (password) user.password = password;
    return publicUser(user);
}

export function deleteUser(data, session, userId) {
    requireAdministrator(data, session);
    const user = data.users.find((entry) => entry.id === userId);
    if (!user) throw new ValidationError("No s’ha trobat l’usuari.");
    if (user.role === "administrator") throw new ValidationError("No es pot eliminar l’únic compte d’administració.");

    const administratorId = data.users.find((entry) => entry.role === "administrator").id;
    data.users = data.users.filter((entry) => entry.id !== userId);
    data.teacherAssignments = data.teacherAssignments.filter((entry) => entry.teacherId !== userId);
    data.studentAssignments = data.studentAssignments.filter((entry) => entry.studentId !== userId);
    data.grades = data.grades.filter((entry) => entry.teacherId !== userId && entry.studentId !== userId);
    for (const project of data.projects) {
        if (project.createdBy === userId) project.createdBy = administratorId;
    }
    return user.id;
}
