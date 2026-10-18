import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoData } from "../frontend/js/modules/demo-data.js";
import { createStorage } from "../frontend/js/modules/storage.js";
import { createItem, deleteItem, listItems, updateItem } from "../frontend/js/modules/evaluable-items.js";
import { AuthorizationError } from "../frontend/js/modules/permissions.js";
import { MemoryStorage } from "./helpers/memory-storage.js";

const admin = { userId: "user-admin" };
const teacher = { userId: "user-marta" };
const student = { userId: "user-marc" };
const draft = { code: "IT-003", name: "Presentació", description: "Presentació final del projecte." };

test("administrator creates, reads, and edits reusable items", () => {
    const data = createDemoData();
    const item = createItem(data, admin, draft);
    updateItem(data, admin, item.id, { ...draft, name: "Presentació final" });
    assert.equal(item.name, "Presentació final");
    assert.equal(listItems(data, admin).length, 3);
    assert.throws(() => createItem(data, admin, { ...draft, code: "it-001" }), /ja existeix/);
});

test("teachers and students see only items in their projects", () => {
    const data = createDemoData();
    assert.deepEqual(listItems(data, teacher).map((item) => item.id), ["item-1", "item-2"]);
    assert.deepEqual(listItems(data, student).map((item) => item.id), ["item-1", "item-2"]);
});

test("only administrators can change evaluable items", () => {
    const data = createDemoData();
    assert.throws(() => createItem(data, teacher, draft), AuthorizationError);
    assert.throws(() => updateItem(data, student, "item-1", draft), AuthorizationError);
    assert.throws(() => deleteItem(data, teacher, "item-1"), AuthorizationError);
});

test("deleting an item removes its project links and grades", () => {
    const data = createDemoData();
    deleteItem(data, admin, "item-1");
    assert.equal(data.items.some((item) => item.id === "item-1"), false);
    assert.equal(data.itemAssignments.some((row) => row.itemId === "item-1"), false);
    assert.equal(data.grades.some((grade) => grade.itemId === "item-1"), false);
    assert.equal(createStorage(new MemoryStorage()).writeData(data), data);
});
