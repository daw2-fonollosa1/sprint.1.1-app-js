import { element } from "./dom.js";

const alertClasses = Object.freeze({ success: "alert-success", error: "alert-danger", info: "alert-info", warning: "alert-warning" });

export function showNotification(container, message, kind = "success") {
    const alert = element("div", {
        className: `alert ${alertClasses[kind] ?? alertClasses.info} alert-dismissible fade show`,
        attributes: { role: kind === "error" ? "alert" : "status" },
    }, [
        message,
        element("button", {
            className: "btn-close",
            attributes: { type: "button", "aria-label": "Tanca el missatge", "data-bs-dismiss": "alert" },
        }),
    ]);
    container.replaceChildren(alert);
    return alert;
}

export function clearNotification(container) {
    container.replaceChildren();
}
