"use strict";
class FloatingWindow extends HTMLElement {
    constructor() {
        super();
        this.atts = {
            width: 600,
            height: 400,
            x: 200,
            y: 50,
            resizable: false,
            title: "Floating Window",
            hidden: false
        };
        this.log = false;
    }
    construct() {
        //get all inline nested elements
        this.nestedElements = Array.from(this.children);
        //construct static elements
        this.topBar = document.createElement("div");
        this.topBar.classList.add("top-bar");
        this.titleText = document.createElement("span");
        this.titleText.textContent = this.atts["title"];
        this.titleText.classList.add("title");
        this.topBar.appendChild(this.titleText);
        this.exitText = document.createElement("span");
        this.exitText.innerHTML = "X";
        this.exitText.classList.add("exit");
        this.topBar.appendChild(this.exitText);
        this.appendChild(this.topBar);
        this.contentDiv = document.createElement("div");
        this.contentDiv.classList.add("content");
        this.appendChild(this.contentDiv);
        //move inline elements to this.contentDiv
        this.nestedElements.forEach((element) => {
            this.contentDiv.appendChild(element);
        });
        //add event handlers
        this.addEventHandlers();
    }
    get hidden() {
        return this.atts.hidden;
    }
    set hidden(bool) {
        this.atts.hidden = bool;
        this.dispatchEvent(new Event("hiddenChanged"));
        this.updateStyle();
    }
    addEventHandlers() {
        //prevent scrolling from affecting canvas
        this.addEventListener("wheel", (event) => {
            event.stopPropagation();
        }, {passive: true});
        //press close to hide window
        this.exitText.addEventListener("click", (event) => {
            this.hidden = true;
            this.updateStyle();
        });
        //grab topbar to drag window
        this.topBar.addEventListener("mousedown", (event) => {
            this.grab = {
                offset: [this.atts.x - event.clientX, this.atts.y - event.clientY],
                controller: new AbortController()
            };
            window.addEventListener("mousemove", (event) => {
                if (this.grab) {
                    this.atts.x = event.clientX + this.grab.offset[0];
                    this.atts.y = event.clientY + this.grab.offset[1];
                    this.updateStyle();
                }
            }, { signal: this.grab.controller.signal });
            window.addEventListener("mouseup", (event) => {
                if (this.grab) {
                    this.grab.controller.abort();
                    this.grab = undefined;
                }
            });
        });
        //grab edges or corners to resize
        this.addEventListener("mousemove", (event) => {
            if ((this.resize && !this.resize.started) || !this.resize) {
                const grabMargin = 10;
                const rightEdge = this.atts.x + this.atts.width;
                const leftEdge = this.atts.x;
                const lowerEdge = this.atts.y + this.atts.height;
                const right = (event.clientX >= rightEdge - grabMargin);
                const left = (event.clientX <= leftEdge + grabMargin);
                const lower = (event.clientY >= lowerEdge - grabMargin);
                if (right && !lower) {
                    this.style.cursor = "e-resize";
                    this.resize = { direction: "e" };
                }
                if (right && lower) {
                    this.style.cursor = "se-resize";
                    this.resize = { direction: "se" };
                }
                if (lower && !left && !right) {
                    this.style.cursor = "s-resize";
                    this.resize = { direction: "s" };
                }
                if (left && lower) {
                    this.style.cursor = "sw-resize";
                    this.resize = { direction: "sw" };
                }
                if (left && !lower) {
                    this.style.cursor = "w-resize";
                    this.resize = { direction: "w" };
                }
                if (!left && !right && !lower) {
                    this.style.cursor = "default";
                    this.resize = undefined;
                }
                else {
                    this.resize.offset = [event.clientX, event.clientY];
                    this.resize.startWidth = this.atts.width;
                    this.resize.startHeight = this.atts.height;
                    this.resize.startX = this.atts.x;
                }
            }
        });
        window.addEventListener("mousemove", (event) => {
            //resize action is ongoing
            if (this.resize && this.resize.started) {
                const delta = [
                    event.clientX - this.resize.offset[0],
                    event.clientY - this.resize.offset[1]
                ];
                if (["e", "se"].includes(this.resize.direction)) {
                    this.atts.width = this.resize.startWidth + delta[0];
                }
                if (["sw", "s", "se"].includes(this.resize.direction)) {
                    this.atts.height = this.resize.startHeight + delta[1];
                }
                if (["w", "sw"].includes(this.resize.direction)) {
                    this.atts.width = this.resize.startWidth - delta[0];
                    this.atts.x = this.resize.startX + delta[0];
                }
                this.updateStyle();
            }
        });
        this.addEventListener("mousedown", (event) => {
            //if cursor is over a grabbable zone, start resize action
            if (this.resize) {
                this.resize.started = true;
            }
        });
        window.addEventListener("mouseup", (event) => {
            this.resize = undefined;
        });
    }
    connectedCallback() {
        if (this.log)
            console.log(`${this.constructor.name} element added to page.`);
        //defer construction until inner DOM is loaded
        document.addEventListener("DOMContentLoaded", (event) => {
            this.construct();
            //update style from this.atts
            this.updateStyle();
        });
    }
    updateStyle() {
        this.style.left = this.atts.x + "px";
        this.style.top = this.atts.y + "px";
        this.style.width = this.atts.width + "px";
        this.style.height = this.atts.height + "px";
        if (this.atts.hidden) {
            this.style.display = "none";
        }
        else {
            this.style.display = "block";
        }
    }
    toggle() {
        this.hidden = !this.hidden;
        return !this.hidden;
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
FloatingWindow.observedAttributes = ["title", "width", "height", "resizable", "hidden"];
customElements.define("floating-window", FloatingWindow);
//# sourceMappingURL=floating-window.js.map