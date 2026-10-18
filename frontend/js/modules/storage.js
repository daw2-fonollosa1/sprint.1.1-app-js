export const STORAGE_KEYS = Object.freeze({
    data: "daw2ProjectManager:data",
    session: "daw2ProjectManager:session",
});

export const CURRENT_SCHEMA_VERSION = 2;

function createEmptyData() {
    return {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        users: [],
        projects: [],
        items: [],
        teacherAssignments: [],
        studentAssignments: [],
        itemAssignments: [],
        grades: [],
    };
}

export class StorageError extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = "StorageError";
    }
}

export function createId(prefix = "record") {
    const randomId = globalThis.crypto?.randomUUID?.();
    const suffix = randomId ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}-${suffix}`;
}

export function assertDataIntegrity(data) {
    const collectionNames = ["users", "projects", "items", "teacherAssignments", "studentAssignments", "itemAssignments", "grades"];
    if (!data || data.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        throw new StorageError("La versió de les dades no és compatible.");
    }
    for (const name of collectionNames) {
        if (!Array.isArray(data[name])) throw new StorageError(`Les dades de ${name} no són vàlides.`);
        const ids = data[name].map((record) => record?.id);
        if (ids.some((id) => typeof id !== "string" || id.length === 0) || new Set(ids).size !== ids.length) {
            throw new StorageError(`Hi ha identificadors no vàlids o duplicats a ${name}.`);
        }
    }

    const userById = new Map(data.users.map((user) => [user.id, user]));
    const projectIds = new Set(data.projects.map((project) => project.id));
    const itemIds = new Set(data.items.map((item) => item.id));
    const administratorCount = data.users.filter((user) => user.role === "administrator").length;
    if ((data.users.length > 0 && administratorCount !== 1)
        || (data.users.length === 0 && collectionNames.slice(1).some((name) => data[name].length > 0))) {
        throw new StorageError("Les dades han de tenir un administrador o estar completament buides.");
    }

    const checkAssignments = (rows, key, expectedRole, label) => {
        const pairs = new Set();
        for (const row of rows) {
            const user = userById.get(row[key]);
            if (!user || user.role !== expectedRole || !projectIds.has(row.projectId)) {
                throw new StorageError(`Hi ha una assignació no vàlida a ${label}.`);
            }
            const pair = `${row[key]}:${row.projectId}`;
            if (pairs.has(pair)) throw new StorageError(`Hi ha una assignació duplicada a ${label}.`);
            pairs.add(pair);
        }
    };
    checkAssignments(data.teacherAssignments, "teacherId", "teacher", "teacherAssignments");
    checkAssignments(data.studentAssignments, "studentId", "student", "studentAssignments");

    const itemPairs = new Set();
    for (const row of data.itemAssignments) {
        const pair = `${row.itemId}:${row.projectId}`;
        if (!itemIds.has(row.itemId) || !projectIds.has(row.projectId) || itemPairs.has(pair)) {
            throw new StorageError("Hi ha una assignació d’ítem no vàlida o duplicada.");
        }
        itemPairs.add(pair);
    }

    const gradeKeys = new Set();
    const teacherPairs = new Set(data.teacherAssignments.map((row) => `${row.teacherId}:${row.projectId}`));
    const studentPairs = new Set(data.studentAssignments.map((row) => `${row.studentId}:${row.projectId}`));
    for (const grade of data.grades) {
        const key = `${grade.projectId}:${grade.studentId}:${grade.itemId}:${grade.teacherId}`;
        const value = Number(grade.value);
        if (!projectIds.has(grade.projectId) || !userById.has(grade.studentId) || userById.get(grade.studentId).role !== "student"
            || !userById.has(grade.teacherId) || userById.get(grade.teacherId).role !== "teacher"
            || !itemIds.has(grade.itemId) || !itemPairs.has(`${grade.itemId}:${grade.projectId}`)
            || !teacherPairs.has(`${grade.teacherId}:${grade.projectId}`)
            || !studentPairs.has(`${grade.studentId}:${grade.projectId}`)
            || !Number.isFinite(value) || value < 0 || value > 10 || gradeKeys.has(key)) {
            throw new StorageError("Hi ha una qualificació no vàlida o duplicada.");
        }
        gradeKeys.add(key);
    }
    return data;
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function parseStoredValue(raw, label) {
    try {
        return JSON.parse(raw);
    } catch (error) {
        throw new StorageError(`No s’han pogut llegir les dades de ${label}.`, { cause: error });
    }
}

export function createStorage(storage = globalThis.localStorage) {
    if (!storage) throw new StorageError("Aquest navegador no permet accedir a l’emmagatzematge local.");

    const safely = (operation, message) => {
        try {
            return operation();
        } catch (error) {
            if (error instanceof StorageError) throw error;
            throw new StorageError(message, { cause: error });
        }
    };

    return {
        initialize() {
            return safely(() => {
                const existing = storage.getItem(STORAGE_KEYS.data);
                if (existing === null) {
                    const initialData = createEmptyData();
                    assertDataIntegrity(initialData);
                    storage.setItem(STORAGE_KEYS.data, JSON.stringify(initialData));
                    return clone(initialData);
                }

                const storedData = parseStoredValue(existing, "l’aplicació");
                if (storedData.schemaVersion === 1) {
                    const containsOldSampleAccount = storedData.users?.some((user) => user.id === "user-admin" || user.username === "admin-demo");
                    const migratedData = containsOldSampleAccount ? createEmptyData() : { ...storedData, schemaVersion: CURRENT_SCHEMA_VERSION };
                    assertDataIntegrity(migratedData);
                    storage.setItem(STORAGE_KEYS.data, JSON.stringify(migratedData));
                    if (containsOldSampleAccount) storage.removeItem(STORAGE_KEYS.session);
                    return clone(migratedData);
                }

                return assertDataIntegrity(storedData);
            }, "No s’han pogut inicialitzar les dades locals.");
        },
        readData() {
            return safely(() => {
                const existing = storage.getItem(STORAGE_KEYS.data);
                if (existing === null) throw new StorageError("Les dades encara no s’han inicialitzat.");
                return assertDataIntegrity(parseStoredValue(existing, "l’aplicació"));
            }, "No s’han pogut llegir les dades locals.");
        },
        writeData(data) {
            return safely(() => {
                assertDataIntegrity(data);
                storage.setItem(STORAGE_KEYS.data, JSON.stringify(data));
                return data;
            }, "No s’han pogut desar les dades locals.");
        },
        readSession() {
            return safely(() => {
                const raw = storage.getItem(STORAGE_KEYS.session);
                return raw === null ? null : parseStoredValue(raw, "la sessió");
            }, "No s’ha pogut llegir la sessió local.");
        },
        writeSession(session) {
            return safely(() => storage.setItem(STORAGE_KEYS.session, JSON.stringify(session)), "No s’ha pogut desar la sessió local.");
        },
        clearSession() {
            return safely(() => storage.removeItem(STORAGE_KEYS.session), "No s’ha pogut tancar la sessió local.");
        },
    };
}
