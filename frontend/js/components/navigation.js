import { button, element } from "./dom.js";

const roleLabels = Object.freeze({ administrator: "Administrador", teacher: "Professorat", student: "Alumnat" });

export function getNavigationItems(role) {
    const common = [{ view: "dashboard", label: "Tauler" }, { view: "projects", label: "Projectes" }];
    if (role === "administrator") return [...common, { view: "users", label: "Usuaris" }, { view: "items", label: "Ítems avaluables" }, { view: "assignments", label: "Assignacions" }, { view: "grades", label: "Qualificacions" }, { view: "settings", label: "Dades de demostració" }];
    if (role === "teacher") return [...common, { view: "grades", label: "Qualificacions" }];
    if (role === "student") return [...common, { view: "grades", label: "Les meues qualificacions" }];
    return [];
}

export function createSidebar(user, activeView, onLogout) {
    const navigation = getNavigationItems(user.role);
    const navLinks = navigation.map(({ view, label }) => element("li", { className: "nav-item" }, element("a", {
        className: `nav-link${view === activeView ? " active" : ""}`,
        text: label,
        attributes: { href: `#${view}`, "aria-current": view === activeView ? "page" : undefined },
        events: { click: closeMobileNavigation },
    })));

    const sidebar = element("aside", {
        className: "offcanvas-lg offcanvas-start app-sidebar text-white",
        attributes: { tabindex: "-1", id: "main-navigation", "aria-label": "Navegació principal" },
    }, [
        element("div", { className: "offcanvas-header app-sidebar-header" }, [
            element("h2", { className: "offcanvas-title h5 mb-0", text: "Menú principal" }),
            element("button", { className: "btn-close btn-close-white", attributes: { type: "button", "data-bs-dismiss": "offcanvas", "aria-label": "Tanca la navegació" } }),
        ]),
        element("div", { className: "offcanvas-body app-sidebar-body" }, [
            element("div", { className: "app-sidebar-brand-card rounded-4 p-3" }, [
                element("a", { className: "app-sidebar-brand d-flex align-items-center gap-3 text-decoration-none", attributes: { href: "#dashboard" } }, [
                    element("span", { className: "app-sidebar-logo d-inline-flex align-items-center justify-content-center rounded-3", text: "D", attributes: { "aria-hidden": "true" } }),
                    element("span", { className: "d-flex flex-column" }, [
                        element("span", { className: "app-sidebar-kicker", text: "PROJECTE GLOBALITZAT" }),
                        element("span", { className: "app-sidebar-title", text: "Gestió de projectes" }),
                    ]),
                ]),
                element("div", { className: "app-sidebar-role d-flex align-items-center gap-2 mt-3 rounded-3 px-2 py-2" }, [
                    element("span", { className: "app-sidebar-role-dot", attributes: { "aria-hidden": "true" } }),
                    element("span", { className: "d-flex flex-column" }, [
                        element("span", { className: "app-sidebar-role-label", text: "Espai actual" }),
                        element("span", { className: "app-sidebar-role-name", text: roleLabels[user.role] ?? "Usuari" }),
                    ]),
                    element("span", { className: "badge rounded-pill text-bg-light text-primary ms-auto", text: "DAW2" }),
                ]),
            ]),
            element("nav", { className: "mt-4", attributes: { "aria-label": "Seccions de l’aplicació" } }, [
                element("p", { className: "app-sidebar-section-label mb-2 px-2", text: "Seccions" }),
                element("ul", { className: "navbar-nav flex-column gap-1" }, navLinks),
            ]),
            element("div", { className: "app-sidebar-logout mt-auto pt-4" }, button("Tanca la sessió", "btn btn-light w-100", onLogout)),
        ]),
    ]);

    return sidebar;
}

export function createApplicationLayout(app, user, activeView, content, onLogout) {
    const sidebar = createSidebar(user, activeView, onLogout);
    const mobileHeader = element("header", { className: "app-mobile-header d-lg-none" }, [
        element("div", { className: "container d-flex align-items-center justify-content-between py-2" }, [
            element("a", { className: "navbar-brand fw-semibold mb-0", text: "Projectes DAW2", attributes: { href: "#dashboard" } }),
            element("button", { className: "btn btn-outline-primary", text: "Menú", attributes: { type: "button", "data-bs-toggle": "offcanvas", "data-bs-target": "#main-navigation", "aria-controls": "main-navigation", "aria-label": "Obre la navegació" } }),
        ]),
    ]);
    const notification = element("div", { attributes: { id: "notification-region", "aria-live": "polite", "aria-atomic": "true" } });
    const mainContent = element("main", { className: "container app-main py-4 py-lg-5", attributes: { id: "view-root", tabindex: "-1" } }, [notification, content]);
    const page = element("div", { className: "app-page" }, [
        mobileHeader,
        mainContent,
        element("footer", { className: "container app-footer py-4" }, element("p", { className: "mb-0", text: "Projecte de gestió de projectes globalitzats · DAW2" })),
    ]);
    app.replaceChildren(element("div", { className: "app-shell" }, [sidebar, page]));
}

function closeMobileNavigation() {
    const navigation = document.querySelector("#main-navigation");
    if (window.innerWidth < 992 && globalThis.bootstrap?.Offcanvas && navigation) {
        globalThis.bootstrap.Offcanvas.getOrCreateInstance(navigation).hide();
    }
}
