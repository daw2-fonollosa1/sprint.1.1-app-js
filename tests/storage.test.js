import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoData } from "../frontend/js/modules/demo-data.js";
import { assertDataIntegrity, createId, createStorage, STORAGE_KEYS, StorageError } from "../frontend/js/modules/storage.js";
import { MemoryStorage } from "./helpers/memory-storage.js";

test("initialization seeds demonstration data once", () => {
    const backing = new MemoryStorage();
    const storage = createStorage(backing);
    const initial = storage.initialize();

    assert.equal(initial.users.length, 5);
    assert.equal(initial.projects.length, 3);
    assert.equal(initial.grades.length, 6);
    assert.equal(storage.readData().users[0].username, "admin-demo");
});

test("initialization preserves existing edits", () => {
    const backing = new MemoryStorage();
    const storage = createStorage(backing);
    const data = storage.initialize();
    data.projects.push({ id: "project-custom", code: "CUSTOM", name: "My project", description: "Saved project", createdBy: "user-admin" });
    storage.writeData(data);

    assert.equal(storage.initialize().projects.at(-1).code, "CUSTOM");
});

test("storage detects malformed data and never replaces it during initialization", () => {
    const backing = new MemoryStorage();
    backing.setItem(STORAGE_KEYS.data, "{not-json");
    const storage = createStorage(backing);

    assert.throws(() => storage.initialize(), StorageError);
    assert.equal(backing.getItem(STORAGE_KEYS.data), "{not-json");
});

test("integrity check rejects duplicate identifiers and duplicate assignments", () => {
    const duplicateId = createDemoData();
    duplicateId.projects.push({ ...duplicateId.projects[0] });
    assert.throws(() => assertDataIntegrity(duplicateId), /duplicats/);

    const duplicateAssignment = createDemoData();
    duplicateAssignment.teacherAssignments.push({ id: "another", teacherId: "user-marta", projectId: "project-1" });
    assert.throws(() => assertDataIntegrity(duplicateAssignment), /duplicada/);
});

test("demo reset requires confirmation and clears the saved session", () => {
    const backing = new MemoryStorage();
    const storage = createStorage(backing);
    storage.initialize();
    storage.writeSession({ userId: "user-admin" });

    assert.throws(() => storage.resetDemoData(), /confirmar/);
    assert.equal(storage.readSession().userId, "user-admin");
    storage.resetDemoData(true);
    assert.equal(storage.readSession(), null);
    assert.equal(storage.readData().projects.length, 3);
});

test("generated identifiers include the requested prefix and stay unique", () => {
    const values = new Set(Array.from({ length: 100 }, () => createId("test")));
    assert.equal(values.size, 100);
    assert.ok([...values].every((id) => id.startsWith("test-")));
});

test("storage access failures are reported instead of being ignored", () => {
    const readFailure = createStorage({ getItem() { throw new Error("unavailable"); }, setItem() {}, removeItem() {} });
    assert.throws(() => readFailure.initialize(), StorageError);

    const writeFailure = createStorage({ getItem() { return null; }, setItem() { throw new Error("quota exceeded"); }, removeItem() {} });
    assert.throws(() => writeFailure.initialize(), StorageError);
    assert.throws(() => writeFailure.writeData(createDemoData()), StorageError);
});
