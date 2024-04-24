"use strict";
import { math, type Vector, type Range } from "./math.js";

export class Color {
    static interpolate(colorA: Color, colorB: Color, f: number | Vector): Color {
        const hsla = math.interpolate(colorA.#hsla, colorB.#hsla, f) as Vector;
        return new Color(...hsla as [number, number, number, number]);
    }
    static add(colorA: Color, colorB: Color): Color {
        const hsla = math.add(colorA.#hsla, colorB.#hsla) as Vector;
        return new Color(...hsla as [number, number, number, number]);
    }
    static subtract(colorA: Color, colorB: Color): Color {
        const hsla = math.subtract(colorA.#hsla, colorB.#hsla) as Vector;
        return new Color(...hsla as [number, number, number, number]);
    }
    static white() {
        return new Color(0, 100, 100, 1);
    }
    static black() {
        return new Color(0, 100, 0, 1);
    }

    #hsla: Vector = [0, 0, 0, 0];

    constructor(h: number | Range | undefined, s: number | Range | undefined, l: number | Range | undefined, a: number | Range | undefined) {
        if (h === undefined) h = [0, 360] as Range;
        if (s === undefined) s = [0, 100] as Range;
        if (l === undefined) l = [0, 100] as Range;
        if (a === undefined) a = [0, 1] as Range;
        if (typeof h === "number") h = [h, h] as Range;
        if (typeof s === "number") s = [s, s] as Range;
        if (typeof l === "number") l = [l, l] as Range;
        if (typeof a === "number") a = [a, a] as Range; 
        this.#hsla = [0, 0, 0, 0];
        this.randomize(h, s, l, a);
    }
    get hsla(): Vector {
        return this.#hsla;
    }
    
    mutate(hRange = 0, sRange = 0, lRange = 0, aRange = 0): Color {
        const deltaH = math.uniformFloat([-hRange, hRange]) as number;
        const deltaS = math.uniformFloat([-sRange, sRange]) as number;
        const deltaL = math.uniformFloat([-lRange, lRange]) as number;
        const deltaA = math.uniformFloat([-aRange, aRange]) as number;
        return new Color(
            (this.#hsla[0] + deltaH) % 360 as number,
            math.clamp(this.#hsla[1] + deltaS, [0, 100]) as number,
            math.clamp(this.#hsla[2] + deltaL, [0, 100]) as number,
            math.clamp(this.#hsla[3] + deltaA, [0, 1]) as number,
        );
    }
    html() {
        return `hsla(${this.#hsla[0]}, ${this.#hsla[1]}%, ${this.#hsla[2]}%, ${this.#hsla[3]})`;
    }
    randomizeHue(range: Range = [0, 360]) {
        this.#hsla[0] = math.clamp(math.uniformFloat(range), [0, 360]) as number;
        return this;
    }
    randomizeSaturation(range: Range = [0, 100]) {
        this.#hsla[1] = math.clamp(math.uniformFloat(range), [0, 100]) as number;
        return this;
    }
    randomizeLightness(range: Range = [0, 100]) {
        this.#hsla[2] = math.clamp(math.uniformFloat(range), [0, 100]) as number;
        return this;
    }
    randomizeAlpha(range: Range = [0, 1]) {
        this.#hsla[3] = math.clamp(math.uniformFloat(range), [0, 1]) as number;
        return this;
    }
    randomize(hueRange: Range = [0, 360], saturationRange: Range = [0, 100], lightnessRange: Range = [0, 100], alphaRange: Range = [0, 1]) {
        this.randomizeHue(hueRange);
        this.randomizeSaturation(saturationRange);
        this.randomizeLightness(lightnessRange);
        this.randomizeAlpha(alphaRange);
        return this;
    }
    rotateHue(degrees: number) {
        this.#hsla[0] = (this.#hsla[0] + degrees) % 360;
        return this;
    }
}
