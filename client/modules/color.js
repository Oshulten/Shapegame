"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _Color_hsla;
import { math } from "./math.js";
export class Color {
    static interpolate(colorA, colorB, f) {
        const hsla = math.interpolate(__classPrivateFieldGet(colorA, _Color_hsla, "f"), __classPrivateFieldGet(colorB, _Color_hsla, "f"), f);
        return new Color(...hsla);
    }
    static add(colorA, colorB) {
        const hsla = math.add(__classPrivateFieldGet(colorA, _Color_hsla, "f"), __classPrivateFieldGet(colorB, _Color_hsla, "f"));
        return new Color(...hsla);
    }
    static subtract(colorA, colorB) {
        const hsla = math.subtract(__classPrivateFieldGet(colorA, _Color_hsla, "f"), __classPrivateFieldGet(colorB, _Color_hsla, "f"));
        return new Color(...hsla);
    }
    static white() {
        return new Color(0, 100, 100, 1);
    }
    static black() {
        return new Color(0, 100, 0, 1);
    }
    constructor(h, s, l, a) {
        _Color_hsla.set(this, [0, 0, 0, 0]);
        if (h === undefined)
            h = [0, 360];
        if (s === undefined)
            s = [0, 100];
        if (l === undefined)
            l = [0, 100];
        if (a === undefined)
            a = [0, 1];
        if (typeof h === "number")
            h = [h, h];
        if (typeof s === "number")
            s = [s, s];
        if (typeof l === "number")
            l = [l, l];
        if (typeof a === "number")
            a = [a, a];
        __classPrivateFieldSet(this, _Color_hsla, [0, 0, 0, 0], "f");
        this.randomize(h, s, l, a);
    }
    get hsla() {
        return __classPrivateFieldGet(this, _Color_hsla, "f");
    }
    mutate(hRange = 0, sRange = 0, lRange = 0, aRange = 0) {
        const deltaH = math.uniformFloat([-hRange, hRange]);
        const deltaS = math.uniformFloat([-sRange, sRange]);
        const deltaL = math.uniformFloat([-lRange, lRange]);
        const deltaA = math.uniformFloat([-aRange, aRange]);
        return new Color((__classPrivateFieldGet(this, _Color_hsla, "f")[0] + deltaH) % 360, math.clamp(__classPrivateFieldGet(this, _Color_hsla, "f")[1] + deltaS, [0, 100]), math.clamp(__classPrivateFieldGet(this, _Color_hsla, "f")[2] + deltaL, [0, 100]), math.clamp(__classPrivateFieldGet(this, _Color_hsla, "f")[3] + deltaA, [0, 1]));
    }
    html() {
        return `hsla(${__classPrivateFieldGet(this, _Color_hsla, "f")[0]}, ${__classPrivateFieldGet(this, _Color_hsla, "f")[1]}%, ${__classPrivateFieldGet(this, _Color_hsla, "f")[2]}%, ${__classPrivateFieldGet(this, _Color_hsla, "f")[3]})`;
    }
    randomizeHue(range = [0, 360]) {
        __classPrivateFieldGet(this, _Color_hsla, "f")[0] = math.clamp(math.uniformFloat(range), [0, 360]);
        return this;
    }
    randomizeSaturation(range = [0, 100]) {
        __classPrivateFieldGet(this, _Color_hsla, "f")[1] = math.clamp(math.uniformFloat(range), [0, 100]);
        return this;
    }
    randomizeLightness(range = [0, 100]) {
        __classPrivateFieldGet(this, _Color_hsla, "f")[2] = math.clamp(math.uniformFloat(range), [0, 100]);
        return this;
    }
    randomizeAlpha(range = [0, 1]) {
        __classPrivateFieldGet(this, _Color_hsla, "f")[3] = math.clamp(math.uniformFloat(range), [0, 1]);
        return this;
    }
    randomize(hueRange = [0, 360], saturationRange = [0, 100], lightnessRange = [0, 100], alphaRange = [0, 1]) {
        this.randomizeHue(hueRange);
        this.randomizeSaturation(saturationRange);
        this.randomizeLightness(lightnessRange);
        this.randomizeAlpha(alphaRange);
        return this;
    }
    rotateHue(degrees) {
        __classPrivateFieldGet(this, _Color_hsla, "f")[0] = (__classPrivateFieldGet(this, _Color_hsla, "f")[0] + degrees) % 360;
        return this;
    }
}
_Color_hsla = new WeakMap();
