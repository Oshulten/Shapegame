import { math } from "./math.js";
export const Coords = {
    /**
     * Constructs a orthonormal rectangle using dimensions
     * @param anchor Anchor corner used together with anchoring
     * @param w Size of box along x-axis
     * @param h Size of box along y-axis
     * @param anchoring "top-left" | "top-center" | "top-right" | "center-left" | "center-center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right"
     */
    dimBox: function (anchor, w, h, anchoring = "top-left") {
        const [anchorX, anchorY] = anchor;
        let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
        switch (anchoring.split("-")[0]) {
            case "top":
                y1 = anchorY;
                y2 = anchorY + h;
                break;
            case "center":
                y1 = anchorY - h * 0.5;
                y2 = anchorY + h * 0.5;
                break;
            case "bottom":
                y1 = anchorY - h;
                y2 = anchorY;
                break;
            default:
                console.error(`Shape.coordsFromRectangle: ${anchoring} is not a valid anchoring value.`);
                break;
        }
        switch (anchoring.split("-")[1]) {
            case "left":
                x1 = anchorX;
                x2 = anchorX + w;
                break;
            case "center":
                x1 = anchorX - w * 0.5;
                x2 = anchorX + w * 0.5;
                break;
            case "right":
                x1 = anchorX - w;
                x2 = anchorX;
                break;
            default:
                console.error(`Shape.coordsFromRectangle: ${anchoring} is not a valid anchoring value.`);
                break;
        }
        return [
            [x1, y1],
            [x2, y1],
            [x2, y2],
            [x1, y2],
        ];
    },
    /**
     * Constructs a rectangle using two corners
     * @param cornerA First corner
     * @param cornerB Second corner
     * @returns A 2d-coordinate list
     */
    cornerBox: function (cornerA, cornerB) {
        return [cornerA, [cornerB[0], cornerA[1]], cornerB, [cornerA[0], cornerB[1]]];
    },
    /**
     * Constructs a circle from a center and a radius
     * @param {[number, number]} center
     * @param {number} radius
     * @param {number} numVertices Number of vertices around the circle's perimeter
     * @returns {number[]} A 2d-coordinate list
     */
    circle: function (center, radius, numVertices) {
        const [centerX, centerY] = center;
        let vertices = [];
        for (let theta of math.linearPartition([0, 2 * Math.PI], numVertices, false)) {
            vertices.push([radius * Math.cos(theta) + centerX, radius * Math.sin(theta) + centerY]);
        }
        return vertices;
    },
};
export const Path = {
    concretizePath: function (path, domain, numVertices) {
        const vertices = [];
        for (const p of math.linearPartition(domain, numVertices, false)) {
            vertices.push(path(p));
        }
        return vertices;
    },
    evaluatePath: function (path, p) {
        return path(p);
    },
    circle: function (dilation = [1, 1], translation = [0, 0]) {
        return (p) => {
            return math.add(math.multiply([Math.cos(p * 2 * Math.PI), Math.sin(p * 2 * Math.PI)], dilation), translation);
        };
    },
    translate: function (path, translation) {
        return (p) => {
            return math.add(path(p), translation);
        };
    },
    dilate: function (path, dilation) {
        return (p) => {
            return math.multiply(path(p), dilation);
        };
    },
    shiftDomain: function (path, shift) {
        return (p) => {
            return path(p + shift);
        };
    },
};
