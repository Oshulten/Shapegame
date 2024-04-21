"use strict";
class Component extends HTMLElement {
    constructor() {
        super();
        this.atts = {};
        this.log = false;
    }
    connectedCallback() {
        if (this.log)
            console.log(`${this.constructor.name} element added to page.`);
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
Component.observedAttributes = ["color", "size"];
customElements.define("com-ponent", Component);
//# sourceMappingURL=component-template.js.map