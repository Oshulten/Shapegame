import { Shape } from "./shape.js";
import { Camera } from "./camera.js";
import { Layer } from "./layer.js";
import { math } from "./math.js";
import { Color } from "./color.js";
import { World } from "./world.js";
import { WorkshopCommands } from "./workshop-commands.js";
import { WorkshopDefaultSettings } from "./workshop-settings.js";

/**
 * @typedef {Object} Grid
 * @property {number} spacing
 * @property {Coords2D} offset
 * @property {boolean} snap
 * @property {Coords2D} snappedCoordinates
 */

/**
 * A workshop is a tool that allows the user to interact with the world and its layers.
 */
export class Workshop {
    world; /** @property {World} */
    camera; /** @property {Camera} */
    ctx; /** @property {CanvasRenderingContext2D} */
    activeLayer; /** @property {Layer} */
    settings; /** @property {WorkshopSettings} */
    commands; /** @property {WorkshopCommand[]} */
    activeCommand; /** @property {WorkshopCommand} */
    grid; /** @property {Grid} */
    focus = false; /** @property {boolean} */

    /**
     *
     * @param {World} world World instance that this workshop will interact with
     * @param {Layer} activeLayer Layer instance that this workshop will interact with
     */
    constructor(world, activeLayer = undefined) {
        this.world = world;
        this.camera = world.camera;
        this.ctx = world.ctx;
        this.activeLayer = activeLayer;
        this.settings = { ...WorkshopDefaultSettings };
        this.commands = WorkshopCommands;
        this.commands.forEach((command) => {
            command.method = command.method.bind(this);
            command.previewMethod = command.previewMethod.bind(this);
        });
        this.activeCommand = undefined;
        this.grid = { ...WorkshopDefaultSettings.gridSettings };
        this.ctx.canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            if (this.activeLayer?.firstHoverShape) {
                const contextMenu = document.createElement("context-menu");
                contextMenu.style.left = event.clientX - 10 + "px";
                contextMenu.style.top = event.clientY - 10 + "px";
                contextMenu.addItems([
                    {
                        label: "Delete",
                        callback: () => {
                            this.activeLayer.deleteShape(this.activeLayer.firstHoverShape);
                        },
                    },
                ]);
                document.body.appendChild(contextMenu);
            }
        });
    }
    tryCommand(alias) {
        console.log("trying command " + alias);
        this.commands.forEach((command) => {
            command.aliases.forEach((a) => {
                if (alias === a) {
                    console.log("recognized alias " + a);
                    command.method(command)
                        .then(() => {
                            if (command.repeatCommand) {
                                this.tryCommand(alias);
                            }
                        })
                        .catch(() => {});
                    return true;
                }
            });
        });
        return false;
    }

    renderPreview() {
        if (this.activeCommand) {
            this.activeCommand.command.previewMethod.bind(this)();
        }
    }
    getPointsByCursor(numberOfPoints) {
        let points = [];
        return new Promise(async (resolve, reject) => {
            if (typeof numberOfPoints === "number") {
                try {
                    for (let i = 0; i < numberOfPoints; i++) {
                        let p = await this.getPointByCursor();
                        points.push(p);
                    }
                    resolve(points);
                } catch (error) {
                    reject(error);
                }
            } else if (typeof numberOfPoints === "string" && numberOfPoints === "close") {
                try {
                    while (true) {
                        let p = await this.getPointByCursor();
                        const closeThreshold = this.camera.dimToScreen(this.settings.closePolylineThreshold, this.activeLayer.depth);
                        if (points.length >= 3 && math.distance(points[0], p) <= this.settings.closePolylineThreshold) {
                            resolve(points);
                        } else {
                            points.push(p);
                        }
                    }
                } catch (error) {
                    reject(error);
                }
            }
        });
    }
    getPointByCursor() {
        const button = 0;
        return new Promise((resolve, reject) => {
            const controller = new AbortController();
            const c = this.activeCommand;
            this.world.ctx.canvas.addEventListener(
                "mousedown",
                (event) => {
                    if (event.button === button) {
                        let p = [...this.grid.snappedCoordinates];
                        if (c.data.points) c.data.points.push(p);
                        controller.abort();
                        resolve(p);
                    }
                },
                { signal: controller.signal }
            );
            this.world.ctx.canvas.addEventListener(
                "mousemove",
                () => {
                    if (c.data) {
                        c.data.cursorPoint = this.grid.snappedCoordinates;
                    }
                },
                { signal: controller.signal }
            );
            window.addEventListener(
                "keydown",
                (event) => {
                    if (event.code === "Escape") {
                        controller.abort();
                        reject("Escape key was pressed - aborting getPointByCursor");
                    }
                },
                { signal: controller.signal }
            );
        });
    }
    renderCursor() {
        if (this.activeLayer) {
            let viewport = undefined;
            if (this.activeLayer.space === "world") {
                viewport = this.camera.apply(this.activeLayer.depth);
            }
            let c = this.camera.realCursorAtDepth(this.activeLayer.depth);
            if (this.grid.snap) {
                this.grid.snappedCoordinates[0] = math.snapTo(c[0], this.grid.spacing, this.grid.offset[0]);
                this.grid.snappedCoordinates[1] = math.snapTo(c[1], this.grid.spacing, this.grid.offset[1]);
                c = this.grid.snappedCoordinates;
            } else {
                this.grid.snappedCoordinates = c;
            }
            if (this.activeCommand) {
                const w = this.camera.dimToScreen(10);
                const lineWidth = this.camera.dimToScreen(1);
                this.ctx.beginPath();
                this.ctx.moveTo(c[0] - w, c[1] - w);
                this.ctx.lineTo(c[0] + w, c[1] + w);
                this.ctx.moveTo(c[0] - w, c[1] + w);
                this.ctx.lineTo(c[0] + w, c[1] - w);
                this.ctx.closePath();
                this.ctx.lineWidth = lineWidth;
                this.ctx.strokeStyle = "white";
                this.ctx.stroke();
            }
            this.camera.restore();
        }
    }
    renderGrid(originWidth = 1, lineWidth = 1) {
        if (this.activeLayer) {
            const gridLineSpacing = this.grid.spacing;
            let viewport = undefined;
            if (this.activeLayer.space === "world") {
                viewport = this.camera.apply(this.activeLayer.depth);
            } else {
                viewport = this.camera.canvasViewport();
            }
            this.ctx.lineWidth = originWidth;
            this.ctx.strokeStyle = "rgb(255, 255, 255)";
            this.ctx.setLineDash([]);
            this.viewportLineHorizontal(0, viewport);
            this.viewportLineVertical(0, viewport);
            this.ctx.lineWidth = lineWidth;
            this.ctx.strokeStyle = "rgb(255, 255, 255, 0.5";
            const j0 = Math.round(viewport.bottom / gridLineSpacing);
            const jn = Math.round(viewport.top / gridLineSpacing);
            for (let j = j0; j >= jn; j--) {
                this.viewportLineHorizontal(j * gridLineSpacing, viewport);
            }
            const k0 = Math.round(viewport.left / gridLineSpacing);
            const kn = Math.round(viewport.right / gridLineSpacing);
            for (let k = k0; k <= kn; k++) {
                this.viewportLineVertical(k * gridLineSpacing, viewport);
            }
            this.camera.restore();
        }
    }
    viewportLineHorizontal(y, viewport) {
        this.ctx.beginPath();
        this.ctx.moveTo(viewport.left, y);
        this.ctx.lineTo(viewport.right, y);
        this.ctx.stroke();
    }
    viewportLineVertical(x, viewport) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, viewport.top);
        this.ctx.lineTo(x, viewport.bottom);
        this.ctx.stroke();
    }
}
//# sourceMappingURL=workshop.js.map
