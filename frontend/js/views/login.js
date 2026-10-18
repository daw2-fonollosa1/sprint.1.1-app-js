import { element, fieldGroup } from "../components/dom.js";

export function createLoginView({ onSubmit, error = "", initialSetup = false }) {
    const fields = initialSetup ? [
        fieldGroup({ id: "fullName", label: "Nom complet", required: true, placeholder: "Nom i cognoms" }),
        fieldGroup({ id: "username", label: "Nom d’usuari", required: true, placeholder: "nom.cognom" }),
        fieldGroup({ id: "email", label: "Correu electrònic", type: "email", required: true, placeholder: "nom@centre.cat" }),
        fieldGroup({ id: "password", label: "Contrasenya", type: "password", required: true, placeholder: "Mínim 5 caràcters", autoComplete: "new-password" }),
    ] : [
        fieldGroup({ id: "identifier", label: "Nom d’usuari o correu electrònic", required: true, placeholder: "nom.usuari o correu@exemple.cat" }),
        fieldGroup({ id: "password", label: "Contrasenya", type: "password", required: true, placeholder: "••••••••", autoComplete: "current-password" }),
    ];
    const form = element("form", {
        events: {
            submit: (event) => {
                event.preventDefault();
                const values = Object.fromEntries(new FormData(event.currentTarget).entries());
                onSubmit(values);
            },
        },
    }, [
        ...fields,
        element("button", { className: "btn btn-primary btn-lg w-100 mt-2", text: initialSetup ? "Crea l’administrador" : "Inicia la sessió", attributes: { type: "submit" } }),
    ]);
    return element("main", { className: "login-backdrop min-vh-100 d-flex align-items-center py-5" }, [
        element("div", { className: "container" }, [
            element("div", { className: "row justify-content-center" }, [
                element("div", { className: "col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5" }, [
                    element("section", { className: "card login-card" }, [
                        element("div", { className: "card-body p-4 p-md-5" }, [
                            element("div", { className: "login-brand-mark rounded-3 d-flex align-items-center justify-content-center fw-bold mb-4", text: "D", attributes: { "aria-hidden": "true" } }),
                            element("p", { className: "small text-uppercase text-secondary fw-semibold mb-2", text: "Gestió de projectes · DAW2" }),
                            element("h1", { className: "h2 mb-2", text: initialSetup ? "Configura l’aplicació" : "Iniciar sessió" }),
                            element("p", { className: "text-secondary mb-4", text: initialSetup ? "Crea el compte d’administració per començar. Aquest pas només apareix una vegada." : "Accedeix al teu espai de treball amb el compte que t’ha facilitat l’administrador." }),
                            error ? element("div", { className: "alert alert-danger", text: error, attributes: { role: "alert" } }) : null,
                            form,
                            element("div", { className: "border-top mt-4 pt-3" }, [
                                element("p", { className: "small text-body-secondary mb-0", text: initialSetup ? "Després de crear l’administrador, els comptes de professorat i alumnat es gestionen des de l’aplicació." : "No hi ha registre públic. Els comptes els gestiona l’administrador." }),
                            ]),
                        ]),
                    ]),
                ]),
            ]),
        ]),
    ]);
}
