import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoData } from "./fixtures/demo-data.js";
import { assertDataIntegrity, createId, createStorage, STORAGE_KEYS, StorageError } from "../frontend/js/modules/storage.js";
import { MemoryStorage } from "./helpers/memory-storage.js";

test("initialization starts with empty data", () => {
    const backing = new MemoryStorage();
    const storage = createStorage(backing);
    const initial = storage.initialize();

    assert.equal(initial.users.length, 0);
    assert.equal(initial.projects.length, 0);
    assert.equal(initial.items.length, 0);
    assert.equal(initial.grades.length, 0);
    assert.deepEqual(storage.readData(), initial);
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

test("initialization clears old sample data and its session", () => {
    const backing = new MemoryStorage();
    const storage = createStorage(backing);
    const oldSampleData = createDemoData();
    oldSampleData.schemaVersion = 1;
    backing.setItem(STORAGE_KEYS.data, JSON.stringify(oldSampleData));
    storage.writeSession({ userId: "user-admin" });

    const migrated = storage.initialize();
    assert.equal(storage.readSession(), null);
    assert.equal(migrated.users.length, 0);
    assert.equal(migrated.projects.length, 0);
    assert.equal(storage.readData().schemaVersion, 2);
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
