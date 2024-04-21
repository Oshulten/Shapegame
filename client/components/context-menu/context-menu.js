"use strict";
class ContextMenu extends HTMLElement {
    constructor() {
        super();
        this.atts = {};
        this.log = false;
    }
    addItems(items) {
        //items = [ { label, callback }, ... ]
        items.forEach((item) => {
            const btn = document.createElement("button");
            btn.textContent = item.label;
            btn.addEventListener("click", (event) => {
                item.callback();
                this.classList.add("hide");
            });
            this.appendChild(btn);
        });
    }
    connectedCallback() {
        if (this.log)
            console.log(`${this.constructor.name} element added to page.`);
        this.addEventListener("mouseleave", (event) => {
            this.classList.add("hide");
        });
    }
    disconnectedCallback() {
        if (this.log)
            console.log(`${this.constructor.name} element removed from page.`);
    }
    adoptedCallback() {
        if (this.log)
            console.log(`${this.constructor.name} element moved to new page.`);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (this.log)
            console.log(`${this.constructor.name}: attribute ${name}: ${oldValue}->${newValue}`);
        this.atts[name] = newValue;
    }
}
ContextMenu.observedAttributes = ["color", "size"];
customElements.define("context-menu", ContextMenu);
//# sourceMappingURL=context-menu.js.map