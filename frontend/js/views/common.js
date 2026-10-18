import { element } from "../components/dom.js";

export function pageHeading(eyebrow, title, description, actions = []) {
    return element("div", { className: "d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4" }, [
        element("div", {}, [
            element("p", { className: "eyebrow mb-2", text: eyebrow }),
            element("h1", { className: "h2 mb-1", text: title }),
            element("p", { className: "text-secondary mb-0", text: description }),
        ]),
        element("div", { className: "d-flex flex-wrap gap-2" }, actions),
    ]);
}

export function card(title, description, content, className = "card border-0 shadow-sm") {
    return element("section", { className }, [
        element("div", { className: "card-body" }, [
            element("div", { className: "mb-3" }, [
                element("h2", { className: "h5 mb-1", text: title }),
                description ? element("p", { className: "small text-secondary mb-0", text: description }) : null,
            ]),
            content,
        ]),
    ]);
}

export function formCard({ title, description = "", fields, submitLabel, onSubmit, cancelButton = null, className = "card form-card" }) {
    const form = element("form", {
        events: {
            submit: (event) => {
                event.preventDefault();
                onSubmit(Object.fromEntries(new FormData(event.currentTarget).entries()));
            },
        },
    }, [
        ...fields,
        element("div", { className: "d-flex flex-wrap gap-2" }, [
            element("button", { className: "btn btn-primary", text: submitLabel, attributes: { type: "submit" } }),
            cancelButton,
        ]),
    ]);
    return element("section", { className }, [
        element("div", { className: "card-body" }, [
            element("div", { className: "mb-3" }, [
                element("h2", { className: "h5 mb-1", text: title }),
                description ? element("p", { className: "small text-secondary mb-0", text: description }) : null,
            ]),
            form,
        ]),
    ]);
}

export function table(headers, rows, emptyMessage, options = {}) {
    const headerRow = element("tr", {}, headers.map((header) => element("th", { text: header.label ?? header, attributes: { scope: "col" } })));
    const bodyRows = rows.map((row) => element("tr", {}, row.map((cell) => element("td", {}, cell))));
    if (bodyRows.length === 0) {
        bodyRows.push(element("tr", {}, element("td", {
            className: "empty-state",
            text: emptyMessage,
            attributes: { colspan: String(headers.length) },
        })));
    }
    return element("div", { className: "table-responsive" }, element("table", { className: `table table-hover align-middle mb-0 ${options.className ?? ""}` }, [
        element("thead", { className: "table-light" }, headerRow),
        element("tbody", {}, bodyRows),
    ]));
}

export function tableCard(title, description, headers, rows, emptyMessage) {
    return element("section", { className: "card border-0 shadow-sm" }, [
        element("div", { className: "p-3 p-lg-4" }, [
            element("h2", { className: "h5 mb-1", text: title }),
            description ? element("p", { className: "small text-secondary mb-0", text: description }) : null,
        ]),
        table(headers, rows, emptyMessage),
    ]);
}

export function statCard(label, value, detail = "") {
    return element("article", { className: "card stat-card h-100" }, element("div", { className: "card-body" }, [
        element("p", { className: "small text-secondary text-uppercase fw-semibold mb-2", text: label }),
        element("p", { className: "stat-value mb-1", text: value }),
        detail ? element("p", { className: "small text-secondary mb-0", text: detail }) : null,
    ]));
}

export function emptyState(message) {
    return element("p", { className: "empty-state mb-0", text: message });
}

export function link(label, href, className = "btn btn-outline-primary") {
    return element("a", { className, text: label, attributes: { href } });
}

export function formatGrade(value) {
    if (value === null || value === undefined) return "Pendent";
    return new Intl.NumberFormat("ca-ES", { maximumFractionDigits: 10 }).format(value);
}

export function roleName(role) {
    return ({ administrator: "Administrador", teacher: "Professorat", student: "Alumnat" })[role] ?? "Usuari";
}

export function formValue(form, name) {
    return form.elements.namedItem(name)?.value ?? "";
}
