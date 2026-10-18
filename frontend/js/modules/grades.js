import { createId } from "./storage.js";
import { requireAdministrator, requireProject, requireTeacher, requireUser, ValidationError } from "./permissions.js";

function gradeValue(value) {
    if (typeof value === "string" && value.trim() === "") throw new ValidationError("Introdueix una qualificació entre 0 i 10.");
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > 10) throw new ValidationError("La qualificació ha de ser un nombre entre 0 i 10.");
    return number;
}

function validateGradeRelationships(data, teacherId, projectId, studentId, itemId) {
    requireProject(data, projectId);
    if (!data.teacherAssignments.some((row) => row.teacherId === teacherId && row.projectId === projectId)) {
        throw new ValidationError("No tens aquest projecte assignat.");
    }
    if (!data.studentAssignments.some((row) => row.studentId === studentId && row.projectId === projectId)) {
        throw new ValidationError("L’alumne no està assignat a aquest projecte.");
    }
    if (!data.itemAssignments.some((row) => row.itemId === itemId && row.projectId === projectId)) {
        throw new ValidationError("L’ítem no està associat a aquest projecte.");
    }
}

export function createGrade(data, session, input) {
    input = input ?? {};
    const teacher = requireTeacher(data, session);
    validateGradeRelationships(data, teacher.id, input.projectId, input.studentId, input.itemId);
    const value = gradeValue(input.value);
    const duplicate = data.grades.some((grade) => grade.projectId === input.projectId
        && grade.studentId === input.studentId && grade.itemId === input.itemId && grade.teacherId === teacher.id);
    if (duplicate) throw new ValidationError("Ja has qualificat aquest ítem per a aquest alumne.");
    const grade = { id: createId("grade"), projectId: input.projectId, studentId: input.studentId, itemId: input.itemId, teacherId: teacher.id, value };
    data.grades.push(grade);
    return grade;
}

export function updateOwnGrade(data, session, gradeId, value) {
    const teacher = requireTeacher(data, session);
    const grade = data.grades.find((entry) => entry.id === gradeId);
    if (!grade) throw new ValidationError("No s’ha trobat la qualificació.");
    if (grade.teacherId !== teacher.id) throw new ValidationError("Només pots editar les qualificacions que has introduït.");
    grade.value = gradeValue(value);
    return grade;
}

export function calculateAverage(values) {
    if (!Array.isArray(values) || values.length === 0) return null;
    return values.reduce((total, value) => total + Number(value), 0) / values.length;
}

export function getAverageForItem(data, projectId, studentId, itemId) {
    const values = data.grades.filter((grade) => grade.projectId === projectId && grade.studentId === studentId && grade.itemId === itemId)
        .map((grade) => grade.value);
    return calculateAverage(values);
}

export function getGradesForTeacher(data, session, projectId = null) {
    const teacher = requireTeacher(data, session);
    const projectIds = new Set(data.teacherAssignments.filter((row) => row.teacherId === teacher.id).map((row) => row.projectId));
    if (projectId !== null && !projectIds.has(projectId)) throw new ValidationError("Aquest projecte no està assignat al teu compte.");
    return data.grades.filter((grade) => projectIds.has(grade.projectId) && (projectId === null || grade.projectId === projectId))
        .map((grade) => ({ ...grade, student: publicUser(data.users.find((user) => user.id === grade.studentId)), teacher: publicUser(data.users.find((user) => user.id === grade.teacherId)), item: data.items.find((item) => item.id === grade.itemId), project: data.projects.find((project) => project.id === grade.projectId), average: getAverageForItem(data, grade.projectId, grade.studentId, grade.itemId) }));
}

export function getGradesForAdministrator(data, session) {
    requireAdministrator(data, session);
    return data.grades.map((grade) => ({ ...grade, student: publicUser(data.users.find((user) => user.id === grade.studentId)), teacher: publicUser(data.users.find((user) => user.id === grade.teacherId)), item: data.items.find((item) => item.id === grade.itemId), project: data.projects.find((project) => project.id === grade.projectId), average: getAverageForItem(data, grade.projectId, grade.studentId, grade.itemId) }));
}

export function getGradesForStudent(data, session) {
    const student = requireUser(data, session, ["student"]);
    const projectIds = new Set(data.studentAssignments.filter((row) => row.studentId === student.id).map((row) => row.projectId));
    const rows = [];
    for (const projectId of projectIds) {
        const project = data.projects.find((entry) => entry.id === projectId);
        const itemIds = data.itemAssignments.filter((row) => row.projectId === projectId).map((row) => row.itemId);
        for (const itemId of itemIds) {
            const item = data.items.find((entry) => entry.id === itemId);
            const teacherGrades = data.grades.filter((grade) => grade.projectId === projectId && grade.studentId === student.id && grade.itemId === itemId)
                .map((grade) => ({ id: grade.id, teacher: publicUser(data.users.find((user) => user.id === grade.teacherId)), value: grade.value }));
            rows.push({ project, item, teacherGrades, average: calculateAverage(teacherGrades.map((grade) => grade.value)) });
        }
    }
    return rows;
}

function publicUser(user) {
    if (!user) return null;
    const { password, ...visibleUser } = user;
    return visibleUser;
}
