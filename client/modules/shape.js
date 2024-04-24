import { Color } from "./color.js";
import { Camera } from "./camera.js";
import { Coords } from "./geometry.js";

/** 
 * @typedef {Object} ShapeJSON
 * @property {Coord2DList} vertices 
 * @property {boolean} isStatic
 * @property {Color} fillColor
 */

/**
 * @typedef {Object} ShapeRenderOptions
 * @property {boolean} fill
 * @private {boolean} stroke
 */

/**
 * Represents a shape in a Layer
 */
export class Shape {
    layer; /** @type {Layer} Which layer this shape belongs to*/
    body; /** @type {Matter.Body} */
    fillColor; /** @type {Color} */
    hover = false; /** @type {boolean} Whether mouse cursor is over shape */

    /**
     * Converts a Coord2DList to Matter.Body
     * @param {Coord2DList} coords 
     * @param {Matter.Body options} options 
     * @returns {Matter.Body}
     */
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
    
    /**
     * @param {Shape} shape 
     * @returns {ShapeJSON} a serializable object
     */
    static serialize(shape) {
        return {
            vertices: shape.body.vertices.map((v) => [v.x, v.y]),
            fillColor: shape.fillColor.hsla,
            isStatic: shape.body.isStatic,
        };
    }
    /**
     * @param {ShapeJSON} jsonObject 
     * @param {Layer} inLayer 
     * @returns {Shape}
     */
    static deserialize(jsonObject, inLayer) {
        return new Shape(inLayer, jsonObject.vertices, {
            isStatic: jsonObject.isStatic !== undefined ? jsonObject.isStatic : true,
            fillColor: jsonObject.fillColor ? new Color(...jsonObject.fillColor) : Color.white(),
            strokeColor: jsonObject.strokeColor ? new Color(...jsonObject.strokeColor) : Color.black(),
        });
    }
    /**
     * 
     * @param {CanvasRenderingContext2D} context 
     * @param {Coord2DList} coords 
     * @param {Matter.Body options} options 
     */
    constructor(layer, coords, options = {}) {
        this.layer = layer;
        this.body = Shape.bodyFromWorldCoords(coords, options);
        this.body.shape = this;
        this.fillColor = options.fillColor || new Color([0, 360], 50, 50, 1);
        this.strokeColor = options.strokeColor || new Color(0, 0, 0, 1);
        Matter.Composite.add(layer.engine.world, this.body);
    }

    /**
     * @returns {number} The maximum dimension of the shape (width or height)
     */
    maxDim() {
        return Math.max(this.body.bounds.max.x - this.body.bounds.min.x, this.body.bounds.max.y - this.body.bounds.min.y);
    }

    /**
     * @param {Color} modulationColor 
     * @param {number[]} modulation
     * @param {ShapeRenderOptions} options 
     */
    render(options = {}, modulationColor = new Color(0, 0, 0, 0), modulation = [0, 0, 0, 0] ) {
        const context = this.layer.ctx;
        context.fillStyle = Color.interpolate(this.fillColor, modulationColor, modulation).html();
        context.strokeStyle = this.strokeColor.html();
        context.beginPath();
        this.body.vertices.forEach(v => {
            context.lineTo(v.x, v.y);
        });
        context.closePath();
        if (options.fill)
            context.fill();
        if (options.stroke)
            context.stroke();
    }
    /**
     * @returns {Coord2D} The position of the shape (center of mass)
     */
    get position() {
        return [
            this.body.position.x,
            this.body.position.y
        ];
    }
    /**
     * @param {Coord2D} position 
     */
    set position(position) {
        Matter.Body.setPosition(this.body, { x: position[0], y: position[1] });
    }
}