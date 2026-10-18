import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoData } from "./fixtures/demo-data.js";
import { createStorage } from "../frontend/js/modules/storage.js";
import { getCurrentUser, login, logout, requireCurrentUser } from "../frontend/js/modules/auth.js";
import { AuthorizationError, ValidationError } from "../frontend/js/modules/permissions.js";
import { MemoryStorage } from "./helpers/memory-storage.js";

function fixture() {
    const storage = createStorage(new MemoryStorage());
    const data = storage.initialize();
    return { data, storage };
}

test("username and email sign-in works for all three roles and persists the session", () => {
    for (const [identifier, role] of [["admin-demo", "administrator"], ["marta@daw2.test", "teacher"], ["student-laura", "student"]]) {
        const { data, storage } = fixture();
        const result = login(data, storage, { identifier, password: "12345" });
        assert.equal(result.user.role, role);
        assert.equal("password" in result.user, false);
        assert.equal(getCurrentUser(data, storage).user.id, result.user.id);
    }
});

test("login rejects missing and incorrect credentials", () => {
    const { data, storage } = fixture();
    assert.throws(() => login(data, storage, { identifier: "", password: "12345" }), ValidationError);
    assert.throws(() => login(data, storage, { identifier: "admin-demo", password: "wrong" }), /no són correctes/);
    assert.equal(getCurrentUser(data, storage), null);
});

test("logout clears the session and protected role checks reject mismatches", () => {
    const { data, storage } = fixture();
    login(data, storage, { identifier: "student-marc", password: "12345" });
    assert.equal(requireCurrentUser(data, storage, ["student"]).user.id, "user-marc");
    assert.throws(() => requireCurrentUser(data, storage, ["administrator"]), AuthorizationError);
    logout(storage);
    assert.equal(getCurrentUser(data, storage), null);
});

test("a persisted session for a deleted user is cleared", () => {
    const { data, storage } = fixture();
    storage.writeSession({ userId: "removed-user" });
    assert.equal(getCurrentUser(data, storage), null);
    assert.equal(storage.readSession(), null);
});
