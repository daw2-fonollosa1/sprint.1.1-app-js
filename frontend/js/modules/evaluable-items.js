import { createId } from "./storage.js";
import { normalizeText, requireAdministrator, requireUser, ValidationError } from "./permissions.js";

function validateItemFields(data, input, ignoredId = null) {
    const code = normalizeText(input.code, "el codi");
    const name = normalizeText(input.name, "el nom");
    const description = normalizeText(input.description, "la descripció");
    const duplicate = data.items.find((item) => item.id !== ignoredId && item.code.toLocaleLowerCase("ca") === code.toLocaleLowerCase("ca"));
    if (duplicate) throw new ValidationError("Aquest codi d’ítem ja existeix.");
    return { code, name, description };
}

export function listItems(data, session) {
    const user = requireUser(data, session);
    if (user.role === "administrator") return [...data.items];
    const projectIds = new Set((user.role === "teacher" ? data.teacherAssignments : data.studentAssignments)
        .filter((row) => (user.role === "teacher" ? row.teacherId : row.studentId) === user.id)
        .map((row) => row.projectId));
    const itemIds = new Set(data.itemAssignments.filter((row) => projectIds.has(row.projectId)).map((row) => row.itemId));
    return data.items.filter((item) => itemIds.has(item.id));
}

export function createItem(data, session, input) {
    input = input ?? {};
    requireAdministrator(data, session);
    const item = { id: createId("item"), ...validateItemFields(data, input) };
    data.items.push(item);
    return item;
}

export function updateItem(data, session, itemId, input) {
    input = input ?? {};
    requireAdministrator(data, session);
    const item = data.items.find((entry) => entry.id === itemId);
    if (!item) throw new ValidationError("No s’ha trobat l’ítem avaluable.");
    Object.assign(item, validateItemFields(data, input, itemId));
    return item;
}

export function deleteItem(data, session, itemId) {
    requireAdministrator(data, session);
    const item = data.items.find((entry) => entry.id === itemId);
    if (!item) throw new ValidationError("No s’ha trobat l’ítem avaluable.");
    data.items = data.items.filter((entry) => entry.id !== itemId);
    data.itemAssignments = data.itemAssignments.filter((entry) => entry.itemId !== itemId);
    data.grades = data.grades.filter((entry) => entry.itemId !== itemId);
    return itemId;
}
