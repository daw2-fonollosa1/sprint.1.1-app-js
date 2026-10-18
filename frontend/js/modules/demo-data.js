export const DEMO_PASSWORD = "12345";

export function createDemoData() {
    return {
        schemaVersion: 1,
        users: [
            { id: "user-admin", fullName: "Administrador de demostració", username: "admin-demo", email: "admin@daw2.test", role: "administrator", password: DEMO_PASSWORD },
            { id: "user-marta", fullName: "Marta Vila Puig", username: "teacher-marta", email: "marta@daw2.test", role: "teacher", password: DEMO_PASSWORD },
            { id: "user-joan", fullName: "Joan Marcet Soler", username: "teacher-joan", email: "joan@daw2.test", role: "teacher", password: DEMO_PASSWORD },
            { id: "user-marc", fullName: "Marc Gómez Ribas", username: "student-marc", email: "marc@daw2.test", role: "student", password: DEMO_PASSWORD },
            { id: "user-laura", fullName: "Laura Pons Bosch", username: "student-laura", email: "laura@daw2.test", role: "student", password: DEMO_PASSWORD },
        ],
        projects: [
            { id: "project-1", code: "PRJ-001", name: "Aplicació de gestió", description: "Projecte de demostració per a DAM2A.", createdBy: "user-admin" },
            { id: "project-2", code: "PRJ-002", name: "Catàleg digital", description: "Projecte de demostració per a DAM2B.", createdBy: "user-admin" },
            { id: "project-3", code: "PRJ-003", name: "Portal de recursos del cicle", description: "Projecte de demostració per a DAM2A.", createdBy: "user-admin" },
        ],
        items: [
            { id: "item-1", code: "IT-001", name: "Documentació", description: "Revisió de la documentació del projecte." },
            { id: "item-2", code: "IT-002", name: "Proves", description: "Revisió de les proves del projecte." },
        ],
        teacherAssignments: [
            { id: "teacher-assignment-1", teacherId: "user-marta", projectId: "project-1" },
            { id: "teacher-assignment-2", teacherId: "user-joan", projectId: "project-1" },
            { id: "teacher-assignment-3", teacherId: "user-marta", projectId: "project-2" },
            { id: "teacher-assignment-4", teacherId: "user-joan", projectId: "project-2" },
            { id: "teacher-assignment-5", teacherId: "user-marta", projectId: "project-3" },
            { id: "teacher-assignment-6", teacherId: "user-joan", projectId: "project-3" },
        ],
        studentAssignments: [
            { id: "student-assignment-1", studentId: "user-marc", projectId: "project-1" },
            { id: "student-assignment-2", studentId: "user-laura", projectId: "project-2" },
            { id: "student-assignment-3", studentId: "user-marc", projectId: "project-3" },
        ],
        itemAssignments: [
            { id: "item-assignment-1", itemId: "item-1", projectId: "project-1" },
            { id: "item-assignment-2", itemId: "item-2", projectId: "project-1" },
            { id: "item-assignment-3", itemId: "item-2", projectId: "project-2" },
            { id: "item-assignment-4", itemId: "item-1", projectId: "project-3" },
            { id: "item-assignment-5", itemId: "item-2", projectId: "project-3" },
        ],
        grades: [
            { id: "grade-1", projectId: "project-1", studentId: "user-marc", itemId: "item-1", teacherId: "user-marta", value: 8.5 },
            { id: "grade-2", projectId: "project-1", studentId: "user-marc", itemId: "item-1", teacherId: "user-joan", value: 9 },
            { id: "grade-3", projectId: "project-1", studentId: "user-marc", itemId: "item-2", teacherId: "user-joan", value: 7.5 },
            { id: "grade-4", projectId: "project-2", studentId: "user-laura", itemId: "item-2", teacherId: "user-marta", value: 8 },
            { id: "grade-5", projectId: "project-3", studentId: "user-marc", itemId: "item-2", teacherId: "user-marta", value: 8 },
            { id: "grade-6", projectId: "project-3", studentId: "user-marc", itemId: "item-2", teacherId: "user-joan", value: 9 },
        ],
    };
}
