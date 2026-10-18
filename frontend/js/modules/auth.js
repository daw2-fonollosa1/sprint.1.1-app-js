import { requireUser, ValidationError } from "./permissions.js";

const homeByRole = Object.freeze({
    administrator: "dashboard",
    teacher: "dashboard",
    student: "dashboard",
});

export function login(data, storage, credentials) {
    const identifier = typeof credentials?.identifier === "string" ? credentials.identifier.trim().toLocaleLowerCase("ca") : "";
    const password = typeof credentials?.password === "string" ? credentials.password : "";
    if (!identifier || !password) throw new ValidationError("Introdueix el nom d’usuari o correu i la contrasenya.");

    const user = data.users.find((entry) => entry.username.toLocaleLowerCase("ca") === identifier || entry.email.toLocaleLowerCase("ca") === identifier);
    if (!user || user.password !== password) throw new ValidationError("El nom d’usuari, el correu o la contrasenya no són correctes.");
    const session = { userId: user.id, startedAt: new Date().toISOString() };
    storage.writeSession(session);
    return { session, user: publicUser(user), destination: homeByRole[user.role] };
}

export function getCurrentUser(data, storage) {
    const session = storage.readSession();
    if (!session) return null;
    const user = data.users.find((entry) => entry.id === session.userId);
    if (!user) {
        storage.clearSession();
        return null;
    }
    return { session, user: publicUser(user) };
}

export function requireCurrentUser(data, storage, roles = []) {
    const current = getCurrentUser(data, storage);
    if (!current) throw new ValidationError("Inicia la sessió per continuar.");
    const user = requireUser(data, current.session, roles);
    return { session: current.session, user: publicUser(user) };
}

export function logout(storage) {
    storage.clearSession();
}

function publicUser(user) {
    const { password, ...visibleUser } = user;
    return visibleUser;
}
