"use strict";
class CommandPrompt extends HTMLElement {
    constructor() {
        super();
        this.parseCallbacks = [];
        this.log = false;
    }
    parsePrompt(text) {
        this.textInput.value = "";
        let parsedCommand = false;
        this.parseCallbacks.forEach((callback) => {
            callback(text);
        });
    }
    focus() {
        this.textInput.focus();
    }
    addParseCallback(callback) {
        this.parseCallbacks.push(callback);
    }
    connectedCallback() {
        if (this.log)
            console.log(`${this.constructor.name} element added to page.`);
        this.textInput = document.createElement("input");
        this.textInput.type = "text";
        this.textInput.size = 100;
        this.textInput.placeholder = "Enter command...";
        this.appendChild(this.textInput);
        this.textInput.addEventListener("keydown", (event) => {
            if (event.code === "Enter") {
                this.parsePrompt(this.textInput.value);
            }
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
    }
}
CommandPrompt.observedAttributes = [];
customElements.define("command-prompt", CommandPrompt);
//# sourceMappingURL=command-prompt.js.map