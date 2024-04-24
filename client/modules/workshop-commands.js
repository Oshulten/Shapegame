import { Shape } from "./shape.js";
import { math } from "./math.js";
import { Color } from "./color.js";
import { Coords } from "./geometry.js";

/** 
 * @typedef {Object} WorkshopCommand
 * @property {string[]} aliases
 * @property {({WorkshopCommand})=>Promise<void>} method
 * @property {()=>void} previewMethod
 * @property {boolean} repeatCommand
 */

export const WorkshopCommands = [
    {
        aliases: ["rectangle", "rect", "r"],
        method: commandRectangle,
        previewMethod: previewRectangle,
        repeatCommand: true,
    },
    {
        aliases: ["circle", "c"],
        method: commandCircle,
        previewMethod: previewCircle,
        repeatCommand: true,
    },
    {
        aliases: ["polyshape", "poly", "pl"],
        method: commandPolyshape,
        previewMethod: previewPolyshape,
        repeatCommand: true,
    },
];

/** POLYSHAPE */
function commandPolyshape(command) {
    return new Promise(async (resolve, reject) => {
        console.log("Polyshape: select at least three coordinates or press Esc to cancel...");
        this.activeCommand = {
            command: command,
            data: {
                points: [],
                cursorPoint: undefined,
            },
        };
        try {
            let pnts = await this.getPointsByCursor("close");
            console.log(pnts);
            const shape = this.activeLayer.addShape(pnts, {
                isStatic: this.settings.createStaticShapes,
            });
            console.log(shape.body.vertices);
        } catch (error) {
            console.log(error);
            reject(error);
        }
        this.activeCommand = undefined;
        resolve();
    });
}
function previewPolyshape() {
    const c = this.activeCommand;
    if (c.data.points.length > 0 && c.data.cursorPoint) {
        if (this.activeLayer.space === "world") {
            this.camera.apply(this.activeLayer.depth);
        }
        const coords = [...c.data.points, c.data.cursorPoint];
        this.ctx.beginPath();
        coords.forEach((c) => {
            this.ctx.lineTo(...c);
        });
        this.ctx.closePath();
        this.ctx.lineWidth = this.camera.dimToScreen(2);
        this.ctx.setLineDash([15, 5]);
        this.ctx.strokeStyle = "white";
        this.ctx.stroke();
        //draw close circle
        const closeThreshold = this.camera.dimToScreen(this.settings.closePolylineThreshold, this.activeLayer.depth);
        if (c.data.points.length > 2 && math.distance(coords[0], coords.at(-1)) <= this.settings.closePolylineThreshold) {
            this.ctx.beginPath();
            this.ctx.arc(...coords[0], this.settings.closePolylineThreshold, 0, 2 * Math.PI);
            this.ctx.closePath();
            this.ctx.lineWidth = this.camera.dimToScreen(1);
            this.ctx.stroke();
        }
        this.camera.restore();
    }
}
/** CIRCLE */
function commandCircle(command) {
    return new Promise(async (resolve, reject) => {
        console.log("Circle: select two coordinates or press Esc to cancel...");
        this.activeCommand = {
            command: command,
            data: {
                points: [],
                cursorPoint: undefined,
            },
        };
        try {
            let pnts = await this.getPointsByCursor(2);
            const radius = math.distance(...pnts);
            const coords = Coords.circle(pnts[0], radius, 48);
            this.activeLayer.addShape(coords, {
                isStatic: this.settings.createStaticShapes,
            });
        } catch (error) {
            console.log(error);
            reject(error);
        }
        this.activeCommand = undefined;
        resolve();
    });
}
function previewCircle() {
    const c = this.activeCommand;
    if (c.data.points.length > 0 && c.data.cursorPoint) {
        if (this.activeLayer.space === "world") {
            this.camera.apply(this.activeLayer.depth);
        }
        const radius = math.distance(c.data.points[0], c.data.cursorPoint);
        const coords = Coords.circle(c.data.points[0], radius, 48);
        this.ctx.beginPath();
        coords.forEach((c) => {
            this.ctx.lineTo(...c);
        });
        this.ctx.closePath();
        this.ctx.lineWidth = this.camera.dimToScreen(2);
        this.ctx.setLineDash([15, 5]);
        this.ctx.strokeStyle = "white";
        this.ctx.stroke();
        this.camera.restore();
    }
}
/** RECTANGLE */
function commandRectangle(command) {
    return new Promise(async (resolve, reject) => {
        console.log("Rectangle: select two coordinates or press Esc to cancel...");
        this.activeCommand = {
            command: command,
            data: {
                points: [],
                cursorPoint: undefined,
            },
        };
        try {
            let pnts = await this.getPointsByCursor(2);
            this.activeLayer.addShape(Coords.cornerBox(...pnts), {
                isStatic: this.settings.createStaticShapes,
            });
            this.activeCommand = undefined;
            resolve();
        } catch (error) {
            console.log(error);
            this.activeCommand = undefined;
            reject(error);
        }
    });
}
function previewRectangle() {
    //render a preview of rectangle command
    const c = this.activeCommand;
    if (c.data.points.length > 0 && c.data.cursorPoint) {
        if (this.activeLayer.space === "world") {
            this.camera.apply(this.activeLayer.depth);
        }
        const coords = Coords.cornerBox(c.data.points[0], c.data.cursorPoint);
        this.ctx.beginPath();
        coords.forEach((c) => {
            this.ctx.lineTo(...c);
        });
        this.ctx.closePath();
        this.ctx.lineWidth = this.camera.dimToScreen(2);
        this.ctx.setLineDash([15, 5]);
        this.ctx.strokeStyle = "white";
        this.ctx.stroke();
        this.camera.restore();
    }
}
