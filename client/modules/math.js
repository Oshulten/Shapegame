"use strict";
export const math = {
    vectorFillDefault: "repeat",
    vectorFill: "repeat",
    snapTo(v, snapInterval, snapOffset = 0) {
        return Math.round((v - snapOffset) / snapInterval) * snapInterval + snapOffset;
    },
    uniformFloat: function (min, max) {
        return Math.random() * (max - min) + min;
    },
    uniformFloats: function (range, amount) {
        const result = [];
        for (let i = 0; i < amount; i++) {
            result.push(math.uniformFloat(range[0], range[1]));
        }
        return result;
    },
    uniformInt: function (min, max) {
        return Math.round(Math.random() * (max - min) + min);
    },
    clamp: function (value, min, max) {
        if (value > max) return max;
        if (value < min) return min;
        return value;
    },
    linearPartition: function (min, max, steps, includeEnd = true) {
        const delta = (max - min) / (steps + (includeEnd ? -1 : 0));
        const series = [];
        for (let i = 0; i <= steps - 1; i++) {
            series.push(min + i * delta);
        }
        return series;
    },
    ratioInInterval: function (min, max, ratio) {
        return min + (max - min) * ratio;
    },
    distance2d: function (v1, v2) {
        return Math.pow(Math.pow(v1[0] - v2[0], 2) + Math.pow(v1[1] - v2[1], 2), 0.5);
    },
    interpolate: function (range, p) {
        return range[0] * (1 - p) + range[1] * p;
    },
    /**
     * Performs a linear interpolation between two vectors element-wise, using fVector to control element interpolations
     * @param {number | number[]} startVector
     * @param {number | number[]} endVector
     * @param {number | number[]} fVector
     * @returns {number[]} Interpolated vector
     */
    vectorInterpolate: function (startVector, endVector, fVector) {
        [startVector, endVector, fVector] = math.matchVectors(startVector, endVector, fVector);
        const interpolation = Array(startVector.length);
        for (let i = 0; i < startVector.length; i++) {
            interpolation[i] = startVector[i] * (1 - fVector[i]) + endVector[i] * fVector[i];
        }
        return interpolation;
    },
    /**
     * Assures that all vectors are of the same length
     * Set math.vectorFill beforehand to control filling
     * math.vectorFill = number: fills shorter vectors with a constant
     * math.vectorFill = "repeat": fills shorter vectors with the last number of the vector
     * math.vectorFill = "cycle": fills shorter vectors with repetitions of itself
     * @param  {...number[] | number} vectors
     * @returns {number[][]} - An array of number arrays with matching length
     */
    matchVectors: function (...vectors) {
        vectors = vectors.map((v) => (typeof v === "number" ? [v] : v));
        const maxLength = Math.max(...vectors.map((v) => v.length));
        if (typeof math.vectorFill === "number") {
            vectors.forEach((v) => {
                while (v.length < maxLength) v.push(math.vectorFill);
            });
        } else if (math.vectorFill === "repeat") {
            vectors.forEach((v) => {
                const lastValue = v.at(-1);
                while (v.length < maxLength) v.push(lastValue);
            });
        } else if (math.vectorFill === "cycle") {
            vectors.forEach((v) => {
                const currentLength = v.length;
                let j = 0;
                while (v.length < maxLength) {
                    v.push(v[j % currentLength]);
                    j++;
                }
            });
        }
        return vectors;
    },
    /**
     * Calculates the distance between two points in n-dimensional space
     * @param {number | number[]} p1
     * @param {number | number[]} p2
     * @returns {number} Distance between the points
     */
    distance: function (p1, p2) {
        [p1, p2] = math.matchVectors(p1, p2);
        let sum = 0;
        for (let i = 0; i < p1.length; i++) {
            sum += (p2[i] - p1[i]) ** 2;
        }
        return Math.sqrt(sum);
    },
    /**
     * Calculates the magnitude of an n-dimensional array
     * @param {number[]} vector
     * @returns The magnitude of the vector
     */
    magnitude: function (vector) {
        [vector] = math.matchVectors(vector);
        return Math.sqrt(vector.reduce((p, c) => p + c ** 2, 0));
    },
    /**
     * Normalizes an n-dimensional vector to have a magnitude of 1, preserving the direction
     * @param {number[]} vector
     * @returns {number[] | undefined} Normalized vector or undefined if vector is 0
     */
    normalize: function (vector) {
        if (typeof vector === "number") return Math.abs(vector) / vector;
        else if (Array.isArray(vector)) {
            const mag = math.magnitude(vector);
            if (mag === 0) return undefined;
            return vector.map((x) => x / mag);
        } else throw new Error("math.normalize: vector must be either a number or a number array");
    },
    /**
     * Adds any number of vectors element-wise
     * @param  {...number[]} vectors Term vectors
     * @returns {number[]} Sum vector
     */
    add: function (...vectors) {
        if (vectors.length === 1) return vectors[0];
        vectors = math.matchVectors(...vectors);
        const result = [];
        for (let i = 0; i < vectors[0].length; i++) {
            result.push(vectors.map((v) => v[i]).reduce((p, c) => p + c, 0));
        }
        return result;
    },
    /**
     * Multiplies any number of vectors element-wise
     * @param  {...number[]} vectors Factor vectors
     * @returns {number[]} Product vector
     */
    multiply: function (...vectors) {
        if (vectors.length === 1) return vectors[0];
        vectors = math.matchVectors(...vectors);
        const result = [];
        for (let i = 0; i < vectors[0].length; i++) {
            result.push(vectors.map((v) => v[i]).reduce((p, c) => p * c, 1));
        }
        return result;
    },
    /**
     * Subtracts all vectors from the first vector element-wise
     * @param  {...number[]} vectors Minuend vector, ...subtrahend vectors
     * @returns {number[]} Difference vector
     */
    subtract: function (...vectors) {
        if (vectors.length === 1) return vectors[0];
        vectors = math.matchVectors(...vectors);
        const result = [];
        for (let i = 0; i < vectors[0].length; i++) {
            result.push(
                vectors
                    .slice(1)
                    .map((v) => v[i])
                    .reduce((p, c) => p - c, vectors[0][i])
            );
        }
        return result;
    },
    divide: function (...vectors) {
        if (vectors.length === 1) return vectors[0];
        vectors = math.matchVectors(...vectors);
        const result = [];
        for (let i = 0; i < vectors[0].length; i++) {
            result.push(
                vectors
                    .slice(1)
                    .map((v) => v[i])
                    .reduce((p, c) => p / c, vectors[0][i])
            );
        }
        return result;
    },
};
