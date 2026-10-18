export class AuthorizationError extends Error {
    constructor(message = "No tens permís per fer aquesta acció.") {
        super(message);
        this.name = "AuthorizationError";
    }
}

export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}

export function requireUser(data, session, roles = []) {
    const user = data.users.find((entry) => entry.id === session?.userId);
    if (!user || (roles.length > 0 && !roles.includes(user.role))) throw new AuthorizationError();
    return user;
}

export function requireAdministrator(data, session) {
    return requireUser(data, session, ["administrator"]);
}

export function requireTeacher(data, session) {
    return requireUser(data, session, ["teacher"]);
}

export function requireProject(data, projectId) {
    const project = data.projects.find((entry) => entry.id === projectId);
    if (!project) throw new ValidationError("No s’ha trobat el projecte.");
    return project;
}

export function normalizeText(value, label) {
    const normalized = typeof value === "string" ? value.trim() : "";
    if (!normalized) throw new ValidationError(`El camp ${label} és obligatori.`);
    return normalized;
}
