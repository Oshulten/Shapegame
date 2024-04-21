import { math } from "./math.js";
import { Color } from "./color.js";
import { Shape } from "./shape.js";

/** A container object that manages a set of Shapes and is a child of a World. */
export class Layer {
    static serialize(layer) {
        return {
            space: layer.space,
            depth: layer.depth,
            id: layer.id,
            modulationColor: layer.modulationColor.hsla,
            modulationFactor: layer.modulationFactor,
            shapes: layer.shapes.map((shape) => Shape.serialize(shape)),
        };
    }
    static deserialize(inWorld, jsonObject) {
        const layer = new Layer(inWorld.ctx, inWorld.camera, jsonObject.space, jsonObject.depth);
        layer.id = jsonObject.id;
        layer.modulationFactor = jsonObject.modulationFactor;
        console.log(jsonObject);
        layer.modulationColor = new Color(...jsonObject.modulationColor);
        for (let shape of jsonObject.shapes) {
            layer.shapes.push(Shape.deserialize(layer, shape));
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
        this.id = math.uniformInt(0, Math.pow(10, 9));
        this.modulationColor = new Color(0, 0, 50, 0);
        this.modulationFactor = [0, 0, 0, 0];
        this.shapes = [];
        this.runPhysics = true;
        window.addEventListener("mousemove", (event) => {
            this.updateCursor(event);
        });
    }
    addShape(coords, options = {}) {
        this.shapes.push(new Shape(this, coords, options));
        return this.shapes.at(-1);
    }
    render() {
        if (this.space === "world") {
            this.camera.apply(this.depth);
        }
        this.shapes.forEach((shape) => {
            this.ctx.fillStyle = Color.interpolate(shape.fillColor, this.modulationColor, this.modulationFactor).html();
            this.ctx.strokeStyle = Color.white().html();
            shape.render({ fill: true, stroke: shape.hover });
        });
        if (this.space === "world") {
            this.camera.restore();
        }
    }
    updateCursor(event) {
        const screenCursor = [event.clientX - this.ctx.canvas.offsetLeft, event.clientY - this.ctx.canvas.offsetTop];
        this.cursor = screenCursor;
        if (this.space === "world") {
            this.cursor = this.camera.coordsToWorld(screenCursor, this.depth);
        }
    }
    update(dt) {
        if (this.runPhysics) {
            Matter.Engine.update(this.engine, dt * 1000);
        }
        // this.shapes.forEach((shape) => {
        //     if (shape instanceof AnimatableShape) {
        //         shape.updateAnimation(dt);
        //     }
        // });
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
