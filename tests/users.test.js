import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoData } from "../frontend/js/modules/demo-data.js";
import { createStorage } from "../frontend/js/modules/storage.js";
import { createUser, deleteUser, listUsers, updateUser } from "../frontend/js/modules/users.js";
import { createProject } from "../frontend/js/modules/projects.js";
import { AuthorizationError, ValidationError } from "../frontend/js/modules/permissions.js";
import { MemoryStorage } from "./helpers/memory-storage.js";

const admin = { userId: "user-admin" };
const teacher = { userId: "user-marta" };
const newStudent = { fullName: "Núria Solé", username: "nuria", email: "nuria@example.test", password: "secret", role: "student" };

test("administrator creates, lists, and edits teacher and student accounts", () => {
    const data = createDemoData();
    const added = createUser(data, admin, { ...newStudent, role: "teacher" });
    assert.equal(added.role, "teacher");
    assert.equal("password" in added, false);
    assert.equal(listUsers(data, admin).length, 6);

    updateUser(data, admin, added.id, { ...newStudent, role: "teacher", fullName: "Núria Solé Vidal", password: "" });
    assert.equal(data.users.find((user) => user.id === added.id).fullName, "Núria Solé Vidal");
    assert.equal(data.users.find((user) => user.id === added.id).password, "secret");
});

test("user creation rejects duplicate usernames and emails without case sensitivity", () => {
    const data = createDemoData();
    assert.throws(() => createUser(data, admin, { ...newStudent, username: "TEACHER-MARTA" }), ValidationError);
    assert.throws(() => createUser(data, admin, { ...newStudent, email: "MARTA@DAW2.TEST" }), ValidationError);
    assert.throws(() => createUser(data, admin, { ...newStudent, email: "invalid" }), /correu electrònic vàlid/);
    assert.equal(data.users.length, 5);
});

test("only administrators can manage users and roles cannot create administrators", () => {
    const data = createDemoData();
    assert.throws(() => listUsers(data, teacher), AuthorizationError);
    assert.throws(() => createUser(data, teacher, newStudent), AuthorizationError);
    assert.throws(() => createUser(data, admin, { ...newStudent, role: "administrator" }), ValidationError);
});

test("deleting a student cascades assignments and grades", () => {
    const data = createDemoData();
    deleteUser(data, admin, "user-marc");
    assert.equal(data.users.some((user) => user.id === "user-marc"), false);
    assert.equal(data.studentAssignments.some((row) => row.studentId === "user-marc"), false);
    assert.equal(data.grades.some((grade) => grade.studentId === "user-marc"), false);
    assert.equal(createStorage(new MemoryStorage()).writeData(data), data);
});

test("deleting a teacher removes their grades and assignments but preserves projects", () => {
    const data = createDemoData();
    deleteUser(data, admin, "user-marta");
    assert.equal(data.teacherAssignments.some((row) => row.teacherId === "user-marta"), false);
    assert.equal(data.grades.some((grade) => grade.teacherId === "user-marta"), false);
    assert.equal(data.projects.length, 3);
    assert.equal(createStorage(new MemoryStorage()).writeData(data), data);
});

test("deleting a teacher transfers ownership of projects they created", () => {
    const data = createDemoData();
    const project = createProject(data, teacher, { code: "OWNED", name: "Projecte propi", description: "Projecte creat pel docent." });
    deleteUser(data, admin, teacher.userId);
    assert.equal(data.projects.find((entry) => entry.id === project.id).createdBy, admin.userId);
    assert.equal(createStorage(new MemoryStorage()).writeData(data), data);
});

test("the single administrator cannot be deleted or demoted", () => {
    const data = createDemoData();
    assert.throws(() => deleteUser(data, admin, "user-admin"), /únic compte/);
    assert.throws(() => updateUser(data, admin, "user-admin", { ...newStudent, role: "teacher" }), /No es pot canviar el rol/);
    assert.equal(data.users.filter((user) => user.role === "administrator").length, 1);
});
