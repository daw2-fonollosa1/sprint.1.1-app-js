import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoData } from "../frontend/js/modules/demo-data.js";
import { createStorage } from "../frontend/js/modules/storage.js";
import { createProject, deleteProject, getProjectDetails, listProjects, updateProject } from "../frontend/js/modules/projects.js";
import { AuthorizationError } from "../frontend/js/modules/permissions.js";
import { MemoryStorage } from "./helpers/memory-storage.js";

const admin = { userId: "user-admin" };
const teacher = { userId: "user-marta" };
const student = { userId: "user-marc" };
const draft = { code: "PRJ-004", name: "Nou projecte", description: "Descripció del projecte." };

test("administrators and teachers create projects with unique codes", () => {
    const data = createDemoData();
    const adminProject = createProject(data, admin, draft);
    assert.equal(adminProject.createdBy, "user-admin");
    const teacherProject = createProject(data, teacher, { ...draft, code: "PRJ-005" });
    assert.equal(teacherProject.createdBy, "user-marta");
    assert.ok(data.teacherAssignments.some((row) => row.teacherId === "user-marta" && row.projectId === teacherProject.id));
    assert.throws(() => createProject(data, teacher, { ...draft, code: "prj-001" }), /ja existeix/);
});

test("students cannot create or edit projects", () => {
    const data = createDemoData();
    assert.throws(() => createProject(data, student, draft), AuthorizationError);
    assert.throws(() => updateProject(data, student, "project-1", draft), AuthorizationError);
    assert.throws(() => deleteProject(data, student, "project-1"), AuthorizationError);
});

test("teachers can edit and delete their own projects only", () => {
    const data = createDemoData();
    const project = createProject(data, teacher, draft);
    updateProject(data, teacher, project.id, { ...draft, name: "Projecte revisat" });
    assert.equal(project.name, "Projecte revisat");
    assert.throws(() => updateProject(data, teacher, "project-1", { ...draft, code: "PRJ-101" }), /has creat/);
    assert.throws(() => deleteProject(data, teacher, "project-1"), /has creat/);
    deleteProject(data, teacher, project.id);
    assert.equal(data.projects.some((entry) => entry.id === project.id), false);
});

test("project deletion removes dependent assignments and grades", () => {
    const data = createDemoData();
    deleteProject(data, admin, "project-1");
    assert.equal(data.teacherAssignments.some((row) => row.projectId === "project-1"), false);
    assert.equal(data.studentAssignments.some((row) => row.projectId === "project-1"), false);
    assert.equal(data.itemAssignments.some((row) => row.projectId === "project-1"), false);
    assert.equal(data.grades.some((row) => row.projectId === "project-1"), false);
    assert.equal(createStorage(new MemoryStorage()).writeData(data), data);
});

test("project lists and details respect role assignments", () => {
    const data = createDemoData();
    assert.equal(listProjects(data, admin).length, 3);
    assert.deepEqual(listProjects(data, student).map((project) => project.id), ["project-1", "project-3"]);
    const details = getProjectDetails(data, student, "project-1");
    assert.equal(details.students[0].id, "user-marc");
    assert.equal(details.items.length, 2);
    assert.throws(() => getProjectDetails(data, student, "project-2"), /no està assignat/);
});
