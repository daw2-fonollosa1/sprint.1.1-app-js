import { createId } from "./storage.js";
import { normalizeText, requireProject, requireUser, ValidationError } from "./permissions.js";

function publicUser(user) {
    const { password, ...visibleUser } = user;
    return visibleUser;
}

function validateProjectFields(data, input, ignoredId = null) {
    const code = normalizeText(input.code, "el codi");
    const name = normalizeText(input.name, "el nom");
    const description = normalizeText(input.description, "la descripció");
    const duplicate = data.projects.find((project) => project.id !== ignoredId && project.code.toLocaleLowerCase("ca") === code.toLocaleLowerCase("ca"));
    if (duplicate) throw new ValidationError("Aquest codi de projecte ja existeix.");
    return { code, name, description };
}

export function listProjects(data, session) {
    const user = requireUser(data, session);
    if (user.role === "administrator") return [...data.projects];
    const assignedIds = new Set((user.role === "teacher" ? data.teacherAssignments : data.studentAssignments)
        .filter((assignment) => (user.role === "teacher" ? assignment.teacherId : assignment.studentId) === user.id)
        .map((assignment) => assignment.projectId));
    return data.projects.filter((project) => assignedIds.has(project.id));
}

export function createProject(data, session, input) {
    input = input ?? {};
    const user = requireUser(data, session, ["administrator", "teacher"]);
    const fields = validateProjectFields(data, input);
    const project = { id: createId("project"), ...fields, createdBy: user.id };
    data.projects.push(project);
    if (user.role === "teacher") {
        data.teacherAssignments.push({ id: createId("teacher-assignment"), teacherId: user.id, projectId: project.id });
    }
    return project;
}

export function updateProject(data, session, projectId, input) {
    input = input ?? {};
    const user = requireUser(data, session, ["administrator", "teacher"]);
    const project = requireProject(data, projectId);
    if (user.role === "teacher" && project.createdBy !== user.id) throw new ValidationError("Només pots editar els projectes que has creat.");
    const fields = validateProjectFields(data, input, projectId);
    Object.assign(project, fields);
    return project;
}

export function deleteProject(data, session, projectId) {
    const user = requireUser(data, session, ["administrator", "teacher"]);
    const project = requireProject(data, projectId);
    if (user.role === "teacher" && project.createdBy !== user.id) throw new ValidationError("Només pots eliminar els projectes que has creat.");

    data.projects = data.projects.filter((entry) => entry.id !== projectId);
    data.teacherAssignments = data.teacherAssignments.filter((entry) => entry.projectId !== projectId);
    data.studentAssignments = data.studentAssignments.filter((entry) => entry.projectId !== projectId);
    data.itemAssignments = data.itemAssignments.filter((entry) => entry.projectId !== projectId);
    data.grades = data.grades.filter((entry) => entry.projectId !== projectId);
    return projectId;
}

export function getProjectDetails(data, session, projectId) {
    const user = requireUser(data, session);
    const project = requireProject(data, projectId);
    if (user.role !== "administrator" && !listProjects(data, session).some((entry) => entry.id === projectId)) {
        throw new ValidationError("Aquest projecte no està assignat al teu compte.");
    }
    return {
        ...project,
        teachers: data.teacherAssignments.filter((entry) => entry.projectId === projectId).map((entry) => publicUser(data.users.find((candidate) => candidate.id === entry.teacherId))),
        students: data.studentAssignments.filter((entry) => entry.projectId === projectId).map((entry) => publicUser(data.users.find((candidate) => candidate.id === entry.studentId))),
        items: data.itemAssignments.filter((entry) => entry.projectId === projectId).map((entry) => data.items.find((candidate) => candidate.id === entry.itemId)),
    };
}
