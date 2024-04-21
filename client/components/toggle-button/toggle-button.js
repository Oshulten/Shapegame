"use strict";
class ToggleButton extends HTMLElement {
    constructor() {
        super();
        this.atts = {
            on: true,
            label: "Toggle",
            padding: 5, //pixels
        };
        this.log = false;
    }
    updateStyle() {
        this.atts.width = Number.parseFloat(window.getComputedStyle(this.outer).width.slice(0, -2));
        this.atts.height = Number.parseFloat(window.getComputedStyle(this.container).height.slice(0, -2));
        this.outer.style.height = this.atts.height;
        this.outer.style.paddingTop = this.atts.padding + "px";
        this.outer.style.paddingBottom = this.atts.padding + "px";
        if (this.atts.on === true) {
            this.outer.style.paddingLeft = this.atts.width + 1 * this.atts.padding - Math.min(this.atts.width, this.atts.height) + "px";
            this.outer.classList.add("on");
        }
        else if (this.atts.on === false) {
            this.outer.style.paddingLeft = this.atts.padding + "px";
            this.outer.classList.remove("on");
        }
        this.outer.style.borderRadius = (Math.min(this.atts.width, this.atts.height) * 0.5) + "px";
        this.inner.style.width = (Math.min(this.atts.width, this.atts.height) - this.atts.padding * 2) + "px";
        this.inner.style.height = this.inner.style.width;
        this.inner.style.borderRadius = "50%";
    }
    connectedCallback() {
        if (this.log)
            console.log(`${this.constructor.name} element added to page.`);
        this.container = document.createElement("div");
        this.container.classList.add("container");
        this.label = document.createElement("span");
        this.label.textContent = this.atts.label;
        this.container.appendChild(this.label);
        this.outer = document.createElement("div");
        this.outer.classList.add("outer");
        this.inner = document.createElement("div");
        this.inner.classList.add("inner");
        this.outer.appendChild(this.inner);
        this.container.appendChild(this.outer);
        this.appendChild(this.container);
        this.outer.addEventListener("click", (event) => {
            this.atts.on = !this.atts.on;
            if (this.atts.on === true) {
                this.dispatchEvent(new CustomEvent("change", {
                    detail: {
                        on: true
                    }
                }));
            }
            else {
                this.dispatchEvent(new CustomEvent("change", {
                    detail: {
                        on: false
                    }
                }));
            }
            this.updateStyle();
        });
        this.updateStyle();
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
        if (name === "on")
            this.atts.on = newValue === 'true' ? true : false;
    }
}
ToggleButton.observedAttributes = ["label", "on"];
customElements.define("toggle-button", ToggleButton);