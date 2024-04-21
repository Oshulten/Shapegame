"use strict";
import { math } from "./math.js";
export class Color {
    static interpolate(colorA, colorB, f) {
        if (typeof f === "number") {
            return new Color(colorA.hsla[0] * (1 - f) + colorB.hsla[0] * (f), colorA.hsla[1] * (1 - f) + colorB.hsla[1] * (f), colorA.hsla[2] * (1 - f) + colorB.hsla[2] * (f), colorA.hsla[3] * (1 - f) + colorB.hsla[3] * (f));
        }
        else if (typeof f === "object") {
            const v = [];
            for (let i = 0; i < 4; i++) {
                v.push(colorA.hsla[i] * (1 - f[i]) + colorB.hsla[i] * (f[i]));
            }
            return new Color(...v);
        }
    }
    static add(colorA, colorB) {
        return new Color(colorA.hsla[0] + colorB.hsla[0], colorA.hsla[1] + colorB.hsla[1], colorA.hsla[2] + colorB.hsla[2], colorA.hsla[3] + colorB.hsla[3]);
    }
    static subtract(colorA, colorB) {
        return new Color(colorA.hsla[0] - colorB.hsla[0], colorA.hsla[1] - colorB.hsla[1], colorA.hsla[2] - colorB.hsla[2], colorA.hsla[3] - colorB.hsla[3]);
    }
    static white() {
        return new Color(0, 100, 100, 1);
    }
    static black() {
        return new Color(0, 100, 0, 1);
    }
    constructor(h, s, l, a) {
        if (arguments === undefined) {
            this.randomize();
        }
        else {
            this.hsla = [h, s, l, a];
            if (typeof h === "object")
                this.hsla[0] = this.randomizeHue(h);
            if (typeof s === "object")
                this.hsla[1] = this.randomizeHue(s);
            if (typeof l === "object")
                this.hsla[2] = this.randomizeHue(l);
            if (typeof a === "object")
                this.hsla[3] = this.randomizeHue(a);
            if (this.hsla[0] === undefined)
                this.randomizeHue([0, 360]);
            if (this.hsla[1] === undefined)
                this.randomizeSaturation([0, 100]);
            if (this.hsla[2] === undefined)
                this.randomizeLightness([0, 100]);
            if (this.hsla[3] === undefined)
                this.randomizeAlpha([0, 1]);
        }
    }
    mutate(hRange = 0, sRange = 0, lRange = 0, aRange = 0) {
        return new Color([
            (this.hsla[0] + math.uniformFloat(-hRange, hRange)) % 360,
            math.clamp(this.hsla[1] + math.uniformFloat(-lRange, lRange), 0, 100),
            math.clamp(this.hsla[2] + math.uniformFloat(-lRange, lRange), 0, 100),
            math.clamp(this.hsla[3] + math.uniformFloat(-lRange, lRange), 0, 1)
        ]);
    }
    html() {
        return `hsla(${this.hsla[0]}, ${this.hsla[1]}%, ${this.hsla[2]}%, ${this.hsla[3]})`;
    }
    randomizeHue([min, max]) {
        this.hsla[0] = math.clamp(math.uniformFloat(min, max), 0, 360);
    }
    randomizeSaturation([min, max]) {
        this.hsla[1] = math.clamp(math.uniformFloat(min, max), 0, 100);
    }
    randomizeLightness([min, max]) {
        this.hsla[2] = math.clamp(math.uniformFloat(min, max), 0, 100);
    }
    randomizeAlpha([min, max]) {
        this.hsla[3] = math.clamp(math.uniformFloat(min, max), 0, 1);
    }
    randomize() {
        this.hsla = [
            Math.random() * 360,
            Math.random() * 100,
            Math.random() * 100,
            Math.random()
        ];
    }
    rotateHue(degrees) {
        this.hsla[0] = (this.hsla[0] + degrees) % 360;
        return this;
    }
    addSaturation(term) {
        this.hsla[1] = math.clamp(this.hsla[1] + term, 0, 100);
    }
    addLightness(term) {
        this.hsla[2] = math.clamp(this.hsla[2] + term, 0, 100);
    }
    addAlpha(term) {
        this.hsla[3] = math.clamp(this.hsla[3] + term, 0, 100);
    }
}
//# sourceMappingURL=color.js.map