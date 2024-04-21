"use strict";
class Toolbar extends HTMLElement {
    constructor() {
        super();
        this.log = false;
    }

    connectWorld(world) {
        console.log(world);
        this.world = world;
        this.worldName = this.querySelector("#world-name");
        if (this.worldName && this.world.filename) {
            this.worldName.value = this.world.filename.split(".")[0];
        }
    }
    connectedCallback() {
        if (this.log)
            console.log(`${this.constructor.name} element added to page.`);
        this.worldName = this.querySelector("#world-name");
        if (this.worldName) {
            this.worldName.value = "Title";
        }
        this.addEventListener("click", (event) => {
            if (this.classList.contains("collapsed")) {
                this.classList.remove("collapsed");
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
class Collapsible extends HTMLElement {
    constructor() {
        super();
        this.labelString = "";
        this.skeletonCreated = false;
    }
    addElement(element) {
        this.querySelector("div.item-div").appendChild(element);
    }
    clearElements() {
        this.querySelector("div.item-div").clearElements();
    }
    connectedCallback() {
        console.log(`${this.constructor.name} element added to page.`);
        this.makeSkeleton();
        this.label.addEventListener("click", (event) => {
            if (this.classList.contains("collapsed")) {
                this.classList.remove("collapsed");
            }
            else {
                this.classList.add("collapsed");
            }
        });
    }
    disconnectedCallback() {
        console.log(`${this.constructor.name} element removed from page.`);
    }
    adoptedCallback() {
        console.log(`${this.constructor.name} element moved to new page.`);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`${this.constructor.name}: attribute ${name}: ${oldValue}->${newValue}`);
        if (name === "label")
            this.labelString = newValue;
    }
    makeSkeleton() {
        if (!this.skeletonCreated) {
            this.markupChildren = this.children;
            console.log(this.markupChildren);
            //label
            this.label = document.createElement("p");
            this.label.textContent = this.labelString;
            this.label.classList.add("label");
            this.appendChild(this.label);
        }
    }
}
Collapsible.observedAttributes = ["label"];
customElements.define("tool-bar", Toolbar);
customElements.define("collapsible-div", Collapsible);
//# sourceMappingURL=tool-bar.js.map