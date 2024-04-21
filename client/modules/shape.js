import { Color } from "./color.js";
import { Camera } from "./camera.js";
import { math } from "./math.js";
import { Coords } from "./geometry.js";

export class Shape {
    static bodyFromWorldCoords(coords, options = {}) {
        const vs = coords.map((coord) => {
            return { x: coord[0], y: coord[1] };
        });
        //Commented out because the method sometimes shuffles the order of the vertices
        //This will cause point-in-body checking to fail if the shape is not constructed clockwise!
        //Matter.Vertices.clockwiseSort(vs);
        const body = Matter.Body.create(options);
        Matter.Body.setVertices(body, vs);
        Matter.Body.setPosition(body, Matter.Vertices.centre(vs));
        body.restitution = 0.5;
        return body;
    }
    
    static serialize(shape) {
        return {
            vertices: shape.body.vertices.map((v) => [v.x, v.y]),
            fillColor: shape.fillColor.hsla,
            isStatic: shape.body.isStatic,
        };
    }
    static deserialize(inLayer, jsonObject) {
        return new Shape(inLayer, jsonObject.vertices, {
            isStatic: jsonObject.isStatic,
            fillColor: new Color(...jsonObject.fillColor)
        });
    }
    constructor(layer, coords, options = {}) {
        this.layer = layer;
        this.body = Shape.bodyFromWorldCoords(coords, options);
        this.body.shape = this;
        this.fillColor = options.fillColor || new Color([0, 360], 50, 50, 1);
        Matter.Composite.add(this.layer.engine.world, this.body);
    }
    maxDim() {
        return Math.max(this.body.bounds.max.x - this.body.bounds.min.x, this.body.bounds.max.y - this.body.bounds.min.y);
    }
    render(options) {
        const ctx = this.layer.ctx;
        ctx.beginPath();
        this.body.vertices.forEach(v => {
            ctx.lineTo(v.x, v.y);
        });
        ctx.closePath();
        if (options.fill)
            ctx.fill();
        if (options.stroke)
            ctx.stroke();
    }
    get position() {
        return [
            this.body.position.x,
            this.body.position.y
        ];
    }
    set position(position) {
        Matter.Body.setPosition(this.body, { x: position[0], y: position[1] });
    }
}