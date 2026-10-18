export function element(tagName, options = {}, children = []) {
    const node = document.createElement(tagName);
    const { className, text, attributes = {}, dataset = {}, events = {}, properties = {} } = options;
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    for (const [name, value] of Object.entries(attributes)) {
        if (value === null || value === undefined || value === false) continue;
        node.setAttribute(name, value === true ? "" : String(value));
    }
    for (const [name, value] of Object.entries(dataset)) node.dataset[name] = String(value);
    for (const [name, handler] of Object.entries(events)) node.addEventListener(name, handler);
    for (const [name, value] of Object.entries(properties)) node[name] = value;
    append(node, children);
    return node;
}

export function append(parent, children) {
    for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) {
        if (child === null || child === undefined || child === false) continue;
        if (typeof Node !== "undefined" && child instanceof Node) parent.append(child);
        else parent.append(document.createTextNode(String(child)));
    }
    return parent;
}

export function button(label, className, onClick, attributes = {}) {
    return element("button", {
        className,
        text: label,
        attributes: { type: "button", ...attributes },
        events: { click: onClick },
    });
}

export function fieldGroup({ id, label, type = "text", value = "", required = false, placeholder = "", helpText = "", inputMode, min, max, step, autoComplete }) {
    const input = element("input", {
        className: "form-control",
        attributes: { id, name: id, type, placeholder, required, min, max, step, inputmode: inputMode, autocomplete: autoComplete ?? (type === "password" ? "new-password" : undefined) },
        properties: { value },
    });
    const children = [element("label", { className: "form-label", text: label, attributes: { for: id } }), input];
    if (helpText) children.push(element("div", { className: "form-text", text: helpText }));
    return element("div", { className: "mb-3" }, children);
}

export function selectGroup({ id, label, options, value = "", required = false, emptyLabel }) {
    const select = element("select", { className: "form-select", attributes: { id, name: id, required } });
    if (emptyLabel) select.append(element("option", { text: emptyLabel, attributes: { value: "" } }));
    for (const option of options) {
        const node = element("option", { text: option.label, attributes: { value: option.value } });
        if (option.value === value) node.selected = true;
        select.append(node);
    }
    return element("div", { className: "mb-3" }, [
        element("label", { className: "form-label", text: label, attributes: { for: id } }),
        select,
    ]);
}
