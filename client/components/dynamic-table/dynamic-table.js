"use strict";
class DynamicTable extends HTMLElement {
    constructor() {
        super();
        this.array = undefined;
        this.log = false;
    }

    refresh() {
        const body = this.querySelectorAll("tbody");
        const rows = body.querySelectorAll("tr");
        rows.forEach((row) => {
            body.removeChild(row);
        });
        this.array.forEach((item) => {
            body.appendChild(this.#rowFromItem(item, this.keys));
        });
    }

    connectArray(proxyArray, options = {}) {
        /*
        options = {
            keys,
            prettyKeys,
            activeObject,
            callbacks: {
                activeObject
            }
        }
        */
        this.array = proxyArray;
        this.keys = options.keys;
        this.prettyKeys = options.prettyKeys;
        this.callbacks = options.callbacks;
        if (this.array.length > 0) {
            if (!this.keys) {
                //assume all objects in the array have the same keys
                this.keys = Object.keys(this.array[0]);
            }
            this.activeObject = options.activeObject;
        }
        this.construct();
    }

    construct() {
        if (!this.array || (this.array && this.array.length < 1)) {
            if (this.log) console.log("No content yet");
            //placeholder content
            this.placeholder = document.createElement("p");
            this.placeholder.textContent = "Empty dynamic table";
            this.classList.add("empty");
            this.appendChild(this.placeholder);
        } else {
            if (this.log) console.log("We have some content, let's make a table!");
            this.classList.remove("empty");
            this.textContent = "";
            this.table = document.createElement("table"); 
            this.tableHead = document.createElement("thead"); 
            this.tableHeadRow = document.createElement("tr");
            this.keys.forEach((key, i) => {
                const headRow = document.createElement("th");
                if (this.prettyKeys) {
                    headRow.textContent = this.prettyKeys[i];
                } else headRow.textContent = key;
                this.tableHeadRow.appendChild(headRow);
            });
            this.tableHead.appendChild(this.tableHeadRow);
            this.table.appendChild(this.tableHead);
            this.tableBody = document.createElement("tbody");
            this.itemRows = [];
            this.array.forEach((item) => {
                const bodyRow = this.#rowFromItem(item, this.keys);
                bodyRow.object = item;
                item.row = bodyRow;
                if (this.activeObject === item) {
                    bodyRow.classList.add("selected");
                }
                bodyRow.addEventListener("click", (event) => {
                    this.#switchActiveObject(bodyRow.object);
                    this.itemRows.forEach((row) => {
                        row.classList.remove("selected");
                    });
                    bodyRow.classList.add("selected");
                });
                this.tableBody.appendChild(item.row);
                this.itemRows.push(item.row);
            });
            this.table.appendChild(this.tableBody);
            this.appendChild(this.table);
        }
    }
    #rowFromItem(item, keys) {
        const bodyRow = document.createElement("tr");
        keys.forEach((key) => {
            const td = document.createElement("td");
            td.textContent = String(item[key]);
            bodyRow.appendChild(td);
        });
        return bodyRow;
    }
    #switchActiveObject(object) {
        this.activeObject = object;
        if (this.callbacks && this.callbacks.activeObject) this.callbacks.activeObject(object);
    }
    connectedCallback() {
        if (this.log) console.log(`${this.constructor.name} element added to page.`);
        this.construct();
    }
    disconnectedCallback() {
        if (this.log) console.log(`${this.constructor.name} element removed from page.`);
    }
    adoptedCallback() {
        if (this.log) console.log(`${this.constructor.name} element moved to new page.`);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (this.log) console.log(`${this.constructor.name}: attribute ${name}: ${oldValue}->${newValue}`);
    }
}
DynamicTable.observedAttributes = [];
customElements.define("dynamic-table", DynamicTable);
