import { createId } from "./storage.js";
import { requireAdministrator, ValidationError } from "./permissions.js";

function requireUserRole(data, userId, role, label) {
    const user = data.users.find((entry) => entry.id === userId);
    if (!user || user.role !== role) throw new ValidationError(`Selecciona un compte de ${label} vàlid.`);
    return user;
}

function requireProjectId(data, projectId) {
    if (!data.projects.some((entry) => entry.id === projectId)) throw new ValidationError("Selecciona un projecte vàlid.");
}

function createAssignment(rows, key, targetId, projectId, prefix, duplicateMessage) {
    if (rows.some((row) => row[key] === targetId && row.projectId === projectId)) throw new ValidationError(duplicateMessage);
    const assignment = { id: createId(prefix), [key]: targetId, projectId };
    rows.push(assignment);
    return assignment;
}

export function assignTeacher(data, session, teacherId, projectId) {
    requireAdministrator(data, session);
    requireUserRole(data, teacherId, "teacher", "professorat");
    requireProjectId(data, projectId);
    return createAssignment(data.teacherAssignments, "teacherId", teacherId, projectId, "teacher-assignment", "Aquest professor ja està assignat al projecte.");
}

export function removeTeacherAssignment(data, session, teacherId, projectId) {
    requireAdministrator(data, session);
    const before = data.teacherAssignments.length;
    data.teacherAssignments = data.teacherAssignments.filter((row) => !(row.teacherId === teacherId && row.projectId === projectId));
    if (data.teacherAssignments.length === before) throw new ValidationError("No s’ha trobat l’assignació del professor.");
    data.grades = data.grades.filter((grade) => !(grade.teacherId === teacherId && grade.projectId === projectId));
}

export function assignStudent(data, session, studentId, projectId) {
    requireAdministrator(data, session);
    requireUserRole(data, studentId, "student", "alumnat");
    requireProjectId(data, projectId);
    return createAssignment(data.studentAssignments, "studentId", studentId, projectId, "student-assignment", "Aquest alumne ja està assignat al projecte.");
}

export function removeStudentAssignment(data, session, studentId, projectId) {
    requireAdministrator(data, session);
    const before = data.studentAssignments.length;
    data.studentAssignments = data.studentAssignments.filter((row) => !(row.studentId === studentId && row.projectId === projectId));
    if (data.studentAssignments.length === before) throw new ValidationError("No s’ha trobat l’assignació de l’alumne.");
    data.grades = data.grades.filter((grade) => !(grade.studentId === studentId && grade.projectId === projectId));
}

export function assignItem(data, session, itemId, projectId) {
    requireAdministrator(data, session);
    if (!data.items.some((item) => item.id === itemId)) throw new ValidationError("Selecciona un ítem avaluable vàlid.");
    requireProjectId(data, projectId);
    return createAssignment(data.itemAssignments, "itemId", itemId, projectId, "item-assignment", "Aquest ítem ja està assignat al projecte.");
}

export function removeItemAssignment(data, session, itemId, projectId) {
    requireAdministrator(data, session);
    const before = data.itemAssignments.length;
    data.itemAssignments = data.itemAssignments.filter((row) => !(row.itemId === itemId && row.projectId === projectId));
    if (data.itemAssignments.length === before) throw new ValidationError("No s’ha trobat l’assignació de l’ítem.");
    data.grades = data.grades.filter((grade) => !(grade.itemId === itemId && grade.projectId === projectId));
}
