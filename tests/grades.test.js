import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoData } from "./fixtures/demo-data.js";
import { createStorage } from "../frontend/js/modules/storage.js";
import { calculateAverage, createGrade, getAverageForItem, getGradesForAdministrator, getGradesForStudent, getGradesForTeacher, updateOwnGrade } from "../frontend/js/modules/grades.js";
import { AuthorizationError } from "../frontend/js/modules/permissions.js";
import { MemoryStorage } from "./helpers/memory-storage.js";

const marta = { userId: "user-marta" };
const joan = { userId: "user-joan" };
const marc = { userId: "user-marc" };
const admin = { userId: "user-admin" };

test("teachers create only valid grades for assigned projects, students, and items", () => {
    const data = createDemoData();
    const grade = createGrade(data, marta, { projectId: "project-1", studentId: "user-marc", itemId: "item-2", value: "7.25" });
    assert.equal(grade.value, 7.25);
    assert.equal(createStorage(new MemoryStorage()).writeData(data), data);
    assert.throws(() => createGrade(data, marta, { projectId: "project-2", studentId: "user-marc", itemId: "item-2", value: 8 }), /no està assignat/);
    assert.throws(() => createGrade(data, marta, { projectId: "project-1", studentId: "user-marc", itemId: "item-3", value: 8 }), /no està associat/);
    assert.throws(() => createGrade(data, { userId: "user-joan" }, { projectId: "project-1", studentId: "user-marc", itemId: "item-1", value: 8 }), /Ja has qualificat/);
});

test("grade values must be finite numbers between zero and ten", () => {
    const data = createDemoData();
    for (const value of ["", "abc", -0.1, 10.01, Infinity, NaN]) {
        assert.throws(() => createGrade(data, marta, { projectId: "project-1", studentId: "user-marc", itemId: "item-2", value }));
    }
});

test("teachers can update their own grades but cannot change another teacher's grade", () => {
    const data = createDemoData();
    const martaGrade = data.grades.find((grade) => grade.teacherId === "user-marta" && grade.projectId === "project-1");
    updateOwnGrade(data, marta, martaGrade.id, "9.5");
    assert.equal(martaGrade.value, 9.5);
    const joanGrade = data.grades.find((grade) => grade.teacherId === "user-joan" && grade.projectId === "project-1");
    assert.throws(() => updateOwnGrade(data, marta, joanGrade.id, 1), /Només pots editar/);
});

test("mean is recalculated across teachers and missing grades stay null", () => {
    const data = createDemoData();
    assert.equal(getAverageForItem(data, "project-1", "user-marc", "item-1"), 8.75);
    assert.equal(getAverageForItem(data, "project-1", "user-marc", "item-2"), 7.5);
    assert.equal(getAverageForItem(data, "project-3", "user-marc", "item-1"), null);
    assert.equal(calculateAverage([]), null);
    createGrade(data, marta, { projectId: "project-1", studentId: "user-marc", itemId: "item-2", value: 8.5 });
    assert.equal(getAverageForItem(data, "project-1", "user-marc", "item-2"), 8);
});

test("teacher and administrator grade views include derived averages", () => {
    const data = createDemoData();
    assert.equal(getGradesForTeacher(data, marta, "project-1").length, 3);
    assert.equal(getGradesForTeacher(data, marta, "project-1")[0].average, 8.75);
    assert.equal(getGradesForAdministrator(data, admin).length, 6);
    assert.throws(() => getGradesForAdministrator(data, marta), AuthorizationError);
    assert.throws(() => getGradesForTeacher(data, marta, "project-4"), /no està assignat/);
});

test("students see only their own assigned items and grades", () => {
    const data = createDemoData();
    const rows = getGradesForStudent(data, marc);
    assert.equal(rows.length, 4);
    assert.equal(rows.some((row) => row.project.id === "project-2"), false);
    assert.equal(rows.find((row) => row.project.id === "project-1" && row.item.id === "item-1").average, 8.75);
    assert.equal(rows.find((row) => row.project.id === "project-1" && row.item.id === "item-2").average, 7.5);
    assert.throws(() => getGradesForStudent(data, marta), AuthorizationError);
});
