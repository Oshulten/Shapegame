import { math } from "./math.js";
import { Color } from "./color.js";
import { Shape } from "./shape.js";

/**
 * @typedef {Object} LayerJSON
 * @property {string} space
 * @property {number} depth
 * @property {number[]} modulationColor
 * @property {number[]} modulationFactor
 * @property {ShapeJSON[]} shapes
 */

/** @enum {"world", "background", "renderspace"} RenderSpace */

/** A container object that manages a set of Shapes and is a child of a World. */
export class Layer {
    ctx; /** {CanvasRenderingContext2D} */
    camera; /** {Camera} */
    engine = Matter.Engine.create(); /** {Matter.Engine} */
    space; /** {RenderSpace} */
    depth; /** {number} */
    modulationColor = new Color(0, 0, 50, 0); /** {Color} */
    modulationFactor = [0, 0, 0, 0]; /** {Vector} */
    shapes = []; /** {Shape[]} */
    runPhysics = true;
    cursor; /** {Coord2D} The position of the screen cursor in */
    /**
     * @param {Layer} layer
     * @returns {LayerJSON}
     */
    static serialize(layer) {
        return {
            space: layer.space,
            depth: layer.depth,
            modulationColor: layer.modulationColor.hsla,
            modulationFactor: layer.modulationFactor,
            shapes: layer.shapes.map((shape) => Shape.serialize(shape)),
        };
    }
    /**
     *
     * @param {CanvasRenderingContext2D} context
     * @param {Camera} camera
     * @param {LayerJSON} jsonObject
     * @returns {Layer}
     */
    static deserialize(context, camera, jsonObject) {
        const layer = new Layer(context, camera, jsonObject.space, jsonObject.depth);
        layer.modulationFactor = jsonObject.modulationFactor;
        layer.modulationColor = new Color(...jsonObject.modulationColor);
        for (let shape of jsonObject.shapes) {
            layer.shapes.push(Shape.deserialize(shape, layer));
        }
        return layer;
    }
    /**
     * @param {CanvasRenderingContext2D} context - A canvas context to render into
     * @param {Camera} camera - A camera object
     * @param {RenderSpace} space - Types: "world", "foreground", "background"
     * @param {number} depth - Distance of layer from camera
     */
    constructor(context, camera, space = "world", depth = 0) {
        this.ctx = context;
        this.camera = camera;
        this.engine = Matter.Engine.create();
        this.space = space;
        this.depth = depth;
        this.modulationColor = new Color(0, 0, 50, 0);
        this.modulationFactor = [0, 0, 0, 0];
        this.shapes = [];
        this.runPhysics = true;
        window.addEventListener("mousemove", (event) => {
            this.updateCursor(event);
        });
    }
    /**
     * @param {Coord2DList} coords
     * @param {Matter.Body options} options
     * @returns {Shape} the created shape
     */
    addShape(coords, options = {}) {
        this.shapes.push(new Shape(this, coords, options));
        return this.shapes.at(-1);
    }
    render() {
        if (this.space === "world") {
            this.camera.apply(this.depth);
        }
        this.shapes.forEach((shape) => {
            shape.render({ fill: true, stroke: shape.hover }, this.modulationColor, this.modulationFactor);
        });
        if (this.space === "world") {
            this.camera.restore();
        }
    }
    /**
     * @param {MouseEvent} event
     */
    updateCursor(event) {
        const screenCursor = [event.clientX - this.ctx.canvas.offsetLeft, event.clientY - this.ctx.canvas.offsetTop];
        this.cursor = screenCursor;
        if (this.space === "world") {
            this.cursor = this.camera.coordsToWorld(screenCursor, this.depth);
        }
    }
    /**
     * Updates the physics of all shapes, and checks for cursor hover
     * @param {number} dt time in seconds since last update
     */
    update(dt) {
        if (this.runPhysics) {
            Matter.Engine.update(this.engine, dt * 1000);
        }
        if (this.cursor) {
            //check if mouse hovers over any shape
            const bodies = this.shapes.map((shape) => shape.body);
            const hoverBodies = Matter.Query.point(bodies, {
                x: this.cursor[0],
                y: this.cursor[1],
            });
            hoverBodies.forEach((b) => {
                b.shape.hover = true;
            });
            if (hoverBodies.length > 0) this.firstHoverShape = hoverBodies[0].shape;
            else this.firstHoverShape = undefined;
            bodies
                .filter((n) => !hoverBodies.includes(n))
                .forEach((b) => {
                    b.shape.hover = false;
                });
        }
    }
    deleteShape(shape) {
        this.shapes = this.shapes.filter((obj) => obj !== shape);
    }
}

/**
 * An extension of Layer which supports generating new content
 * as the camera viewport changes.
 **/
export class DynamicLayer extends Layer {
    constructor(context, camera, space = "world", depth = 0) {
        super(context, camera, space, depth);
    }

    update() {
        super.update();
    }
}
