import { test } from "node:test";
import assert from "node:assert/strict";
import { getNavigationItems } from "../frontend/js/components/navigation.js";

test("navigation exposes only the sections available to each role", () => {
    assert.deepEqual(getNavigationItems("administrator").map((item) => item.view), ["dashboard", "projects", "users", "items", "assignments", "grades", "settings"]);
    assert.deepEqual(getNavigationItems("teacher").map((item) => item.view), ["dashboard", "projects", "grades"]);
    assert.deepEqual(getNavigationItems("student").map((item) => item.view), ["dashboard", "projects", "grades"]);
    assert.deepEqual(getNavigationItems("unknown"), []);
});
