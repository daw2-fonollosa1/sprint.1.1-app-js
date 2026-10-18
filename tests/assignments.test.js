import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoData } from "../frontend/js/modules/demo-data.js";
import { createStorage } from "../frontend/js/modules/storage.js";
import { assignItem, assignStudent, assignTeacher, removeItemAssignment, removeStudentAssignment, removeTeacherAssignment } from "../frontend/js/modules/assignments.js";
import { AuthorizationError } from "../frontend/js/modules/permissions.js";
import { MemoryStorage } from "./helpers/memory-storage.js";

const admin = { userId: "user-admin" };
const teacher = { userId: "user-marta" };

test("teachers and students can be assigned to multiple projects without duplicate links", () => {
    const data = createDemoData();
    data.projects.push({ id: "project-new", code: "NEW", name: "Projecte nou", description: "Projecte nou.", createdBy: "user-admin" });
    assignTeacher(data, admin, "user-marta", "project-new");
    assignStudent(data, admin, "user-laura", "project-1");
    assignItem(data, admin, "item-1", "project-2");
    assert.throws(() => assignTeacher(data, admin, "user-marta", "project-new"), /ja està assignat/);
    assert.throws(() => assignStudent(data, admin, "user-laura", "project-1"), /ja està assignat/);
    assert.throws(() => assignItem(data, admin, "item-1", "project-2"), /ja està assignat/);
    assert.equal(createStorage(new MemoryStorage()).writeData(data), data);
});

test("assignment creation validates roles and record identifiers", () => {
    const data = createDemoData();
    assert.throws(() => assignTeacher(data, admin, "user-marc", "project-1"), /professorat vàlid/);
    assert.throws(() => assignStudent(data, admin, "user-marta", "project-1"), /alumnat vàlid/);
    assert.throws(() => assignItem(data, admin, "missing-item", "project-1"), /ítem avaluable vàlid/);
    assert.throws(() => assignTeacher(data, admin, "user-marta", "missing-project"), /projecte vàlid/);
});

test("removing assignments also removes dependent grades", () => {
    const teacherData = createDemoData();
    removeTeacherAssignment(teacherData, admin, "user-marta", "project-1");
    assert.equal(teacherData.grades.some((grade) => grade.teacherId === "user-marta" && grade.projectId === "project-1"), false);
    assert.equal(createStorage(new MemoryStorage()).writeData(teacherData), teacherData);

    const studentData = createDemoData();
    removeStudentAssignment(studentData, admin, "user-marc", "project-1");
    assert.equal(studentData.grades.some((grade) => grade.studentId === "user-marc" && grade.projectId === "project-1"), false);
    assert.equal(createStorage(new MemoryStorage()).writeData(studentData), studentData);

    const itemData = createDemoData();
    removeItemAssignment(itemData, admin, "item-1", "project-1");
    assert.equal(itemData.grades.some((grade) => grade.itemId === "item-1" && grade.projectId === "project-1"), false);
    assert.equal(createStorage(new MemoryStorage()).writeData(itemData), itemData);
});

test("only administrators can change assignments", () => {
    const data = createDemoData();
    assert.throws(() => assignStudent(data, teacher, "user-laura", "project-1"), AuthorizationError);
    assert.throws(() => removeTeacherAssignment(data, teacher, "user-marta", "project-1"), AuthorizationError);
    assert.throws(() => removeStudentAssignment(data, teacher, "user-marc", "project-1"), AuthorizationError);
    assert.throws(() => removeItemAssignment(data, teacher, "item-1", "project-1"), AuthorizationError);
});

test("removal rejects an assignment that does not exist", () => {
    const data = createDemoData();
    assert.throws(() => removeTeacherAssignment(data, admin, "user-marta", "missing-project"), /No s’ha trobat/);
    assert.throws(() => removeStudentAssignment(data, admin, "user-laura", "project-1"), /No s’ha trobat/);
    assert.throws(() => removeItemAssignment(data, admin, "item-1", "project-2"), /No s’ha trobat/);
});
