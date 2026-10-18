import { element, fieldGroup } from "../components/dom.js";

export function createLoginView({ onSubmit, error = "" }) {
    const form = element("form", {
        events: {
            submit: (event) => {
                event.preventDefault();
                const values = Object.fromEntries(new FormData(event.currentTarget).entries());
                onSubmit(values);
            },
        },
    }, [
        fieldGroup({ id: "identifier", label: "Nom d’usuari o correu electrònic", required: true, placeholder: "nom.usuari o correu@exemple.cat" }),
        fieldGroup({ id: "password", label: "Contrasenya", type: "password", required: true, placeholder: "••••••••" }),
        element("button", { className: "btn btn-primary btn-lg w-100 mt-2", text: "Inicia la sessió", attributes: { type: "submit" } }),
    ]);

    const demoAccounts = [
        ["Administrador", "admin-demo"],
        ["Professorat", "teacher-marta"],
        ["Alumnat", "student-marc"],
    ];
    return element("main", { className: "login-backdrop min-vh-100 d-flex align-items-center py-5" }, [
        element("div", { className: "container" }, [
            element("div", { className: "row justify-content-center" }, [
                element("div", { className: "col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5" }, [
                    element("section", { className: "card login-card" }, [
                        element("div", { className: "card-body p-4 p-md-5" }, [
                            element("div", { className: "login-brand-mark rounded-3 d-flex align-items-center justify-content-center fw-bold mb-4", text: "D", attributes: { "aria-hidden": "true" } }),
                            element("p", { className: "small text-uppercase text-secondary fw-semibold mb-2", text: "Gestió de projectes · DAW2" }),
                            element("h1", { className: "h2 mb-2", text: "Iniciar sessió" }),
                            element("p", { className: "text-secondary mb-4", text: "Accedeix al teu espai de treball amb el compte que t’ha facilitat l’administrador." }),
                            error ? element("div", { className: "alert alert-danger", text: error, attributes: { role: "alert" } }) : null,
                            form,
                            element("div", { className: "border-top mt-4 pt-3" }, [
                                element("p", { className: "small text-body-secondary mb-2", text: "Comptes de demostració · contrasenya: 12345" }),
                                element("ul", { className: "small text-body-secondary mb-0" }, demoAccounts.map(([label, username]) => element("li", { text: `${label}: ${username}` }))),
                                element("p", { className: "small text-body-secondary mt-3 mb-0", text: "No hi ha registre públic. Aquest inici de sessió local només és per a ús educatiu." }),
                            ]),
                        ]),
                    ]),
                ]),
            ]),
        ]),
    ]);
}
