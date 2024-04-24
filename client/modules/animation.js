import { math } from "./math.js";
import { Path } from "./geometry.js";
export const TimeFunctions = {
    linear: function (p) {
        return p;
    },
    easeInEaseOut: function (p) {
        return 0.5 * (1 - Math.cos(Math.PI * p));
    },
    easeIn: function (p) {
        return 1 - Math.cos(Math.PI * p * 0.5);
    },
};
export const DynamicFunctions = {
    attractionFollow: function (g = 50, rPower = 1, minDist = 50, friction = 0.99) {
        return function (animation, dt) {
            let source = animation.sourceObject[animation.sourceKey];
            let target = animation.targetObject[animation.targetKey];
            let dist = math.distance(source, target);
            let dir = math.normalize(math.subtract(source, target));
            let force = g / Math.pow(dist, rPower);
            if (dist < minDist) {
                force = 0;
            }
            animation.velocity = math.add(animation.velocity, math.multiply(dir, force * dt));
            animation.velocity = math.multiply(animation.velocity, friction);
            animation.sourceObject[animation.sourceKey] = math.add(source, math.multiply(animation.velocity, dt));
        };
    },
};
export class AnimationManager {
    static start(animation) {
        this.animations.push(animation);
        return this.animations.at(-1);
    }
    static abort(animation) {
        this.animations = this.animations.filter((obj) => obj !== animation);
    }
    static update(dt) {
        let finishedAnimations = [];
        this.animations.forEach((anim) => {
            if (anim.update(dt) === false) {
                finishedAnimations.push(anim);
            }
        });
        finishedAnimations.forEach((anim) => {
            this.animations = this.animations.filter((obj) => obj !== anim);
        });
    }
}
AnimationManager.animations = [];
export class CallbackAnimation {
    /**
     * @description An animation based on a callback function
     * @param startValues - initial values
     * @param endValues - terminal values
     * @param duration - duration of animation in seconds
     * @param callback - a function that will be called after each update, with the current value of the animation property
     * @param timeFunction - TimeFunctions.linear, .easeInEaseOut, .easeIn,
     * @param iterations - default: 1; domain(1, infinity)
     * @param repeatMode - "loop" | "ping-pong"
     */
    constructor(startValues, endValues, duration, callback, timeFunction = TimeFunctions.easeInEaseOut, iterations = 1, repeatMode = "loop") {
        this.startValues = typeof startValues === "number" ? [startValues] : [...startValues];
        this.endValues = typeof endValues === "number" ? [endValues] : [...endValues];
        this.currentValues = typeof startValues === "number" ? [startValues] : [...startValues];
        this.duration = duration;
        this.timeFunction = timeFunction;
        this.callback = callback;
        this.iterations = iterations;
        this.repeatMode = repeatMode;
        this.time = 0;
    }
    update(dt) {
        this.time += dt;
        let t = this.time / this.duration;
        if (this.time >= this.duration * this.iterations && this.iterations !== -1) {
            return false;
        }
        else {
            if (this.repeatMode === "loop") {
                t %= 1;
            }
            else if (this.repeatMode === "ping-pong") {
                if (t % 2 >= 1 && t % 2 <= 2) {
                    t = 1 - (t - 1);
                }
            }
            let p = this.timeFunction(t);
            this.currentValues = math.interpolate(this.startValues, this.endValues, p);
            this.callback(this.currentValues.length > 1 ? this.currentValues : this.currentValues[0]);
        }
        return true;
    }
}
export class PathAnimation {
    constructor(path, domain, duration, timeFunction, callback, iterations = 1, repeatMode = "loop") {
        this.path = path;
        this.domain = domain;
        this.callback = callback;
        this.linearAnimation = new CallbackAnimation(domain[0], domain[1], duration, (v) => {
            this.callback(Path.evaluatePath(this.path, v));
        }, timeFunction, iterations, repeatMode);
    }
    update(dt) {
        this.linearAnimation.update(dt);
    }
}
export class DynamicAnimation {
    /**
     * Constructs a dynamic animation, which runs perpetually and binds two object properties together
     * @param {object} sourceObject
     * @param {string} sourceKey
     * @param {object} targetObject
     * @param {string} targetKey
     * @param {function} animationMethod
     */
    constructor(sourceObject, sourceKey, targetObject, targetKey, animationMethod) {
        this.sourceObject = sourceObject;
        this.sourceKey = sourceKey;
        this.velocity = [0];
        this.targetObject = targetObject;
        this.targetKey = targetKey;
        this.animationMethod = animationMethod;
    }
    /**
     * Updates the properties of the source object.
     * @param {number} dt - time in seconds since last update
     */
    update(dt) {
        this.animationMethod(this, dt);
    }
}
