"use strict";

export type Vector = number[];
export type Range = [number, number];

export const math = {
    vectorFillDefault: "repeat",
    vectorFill: "repeat",
    inRange: function (v: number, range: Range): boolean {
        return (v >= range[0] && v <= range[1]) || (v >= range[1] && v <= range[0]);
    },
    snapTo(v: number, snapInterval: number, snapOffset: number = 0): number {
        return Math.round((v - snapOffset) / snapInterval) * snapInterval + snapOffset;
    },
    uniformFloat: function (range: Range, amount: number = 1): number | Vector {
        if (amount === 1) return Math.random() * (range[1] - range[0]) + range[0];
        else {
            const result: Vector = [];
            for (let i = 0; i < amount; i++) {
                result.push(Math.random() * (range[1] - range[0]) + range[0]);
            }
            return result;
        }
    },
    uniformInt: function (range: Range, amount: number = 1): number | Vector {
        const result = math.uniformFloat(range, amount);
        if (typeof result === "number") return Math.round(result);
        else return result.map((x) => Math.round(x));
    },
    clamp: function (value: number | Vector, range: Range): number | Vector {
        if (typeof value === "number") {
            value = [value] as Vector;
        }
        value = value.map((v) => Math.min(Math.max(v, range[0]), range[1]));
        if (value.length === 1) return value[0];
        else return value;
    },
    linearPartition: function (range: Range, steps: number, includeEnd: boolean = true): Vector {
        const delta = (range[1] - range[0]) / (steps + (includeEnd ? -1 : 0));
        const series: Vector = [];
        for (let i = 0; i <= steps - 1; i++) {
            series.push(range[0] + i * delta);
        }
        return series;
    },
    ratioInInterval: function (range: Range, ratio: number): number {
        return range[0] + (range[1] - range[0]) * ratio;
    },
    /**
     * Performs a linear interpolation between two vectors element-wise, using fVector to control element interpolations
     * @param startVector
     * @param endVector
     * @param fVector
     * @returns Interpolated vector
     */
    interpolate: function (startVector: number | Vector, endVector: number | Vector, fVector: number | Vector): number | Vector {
        const [_startVector, _endVector, _fVector] = math.matchVectors(startVector, endVector, fVector);
        const interpolation: Vector = Array(_startVector.length);
        for (let i = 0; i < _startVector.length; i++) {
            interpolation[i] = _startVector[i] * (1 - _fVector[i]) + _endVector[i] * _fVector[i];
        }
        if (_startVector.length === 1) {
            return interpolation[0];
        } else return interpolation;
    },
    /**
     * Assures that all vectors are of the same length
     * Set math.vectorFill beforehand to control filling
     * math.vectorFill = number: fills shorter vectors with a constant
     * math.vectorFill = "repeat": fills shorter vectors with the last number of the vector
     * math.vectorFill = "cycle": fills shorter vectors with repetitions of itself
     * @param vectors
     * @returns An array of Vectors with matching length
     */
    matchVectors: function (...vectors: (number | Vector)[]): Vector[] {
        const allVectors = vectors.map((v) => (Array.isArray(v) ? v : [v])) as Vector[];
        const maxLength = Math.max(...allVectors.map((v) => v.length));
        if (typeof math.vectorFill === "number") {
            const fillValue = math.vectorFill as number;
            allVectors.forEach((v) => {
                while (v.length < maxLength) v.push(fillValue);
            });
        } else if (typeof math.vectorFill === "string") {
            if (math.vectorFill === "repeat") {
                allVectors.forEach((v) => {
                    const lastValue: number = v.at(-1) as number;
                    while (v.length < maxLength) v.push(lastValue);
                });
            } else if (math.vectorFill === "cycle") {
                allVectors.forEach((v) => {
                    const currentLength = v.length;
                    let j = 0;
                    while (v.length < maxLength) {
                        v.push(v[j % currentLength]);
                        j++;
                    }
                });
            }
        }
        return allVectors;
    },
    /**
     * Calculates the distance between two points in n-dimensional space
     * @param p1
     * @param p2
     * @returns Distance between the points
     */
    distance: function (p1: number | Vector, p2: number | Vector): number {
        [p1, p2] = math.matchVectors(p1, p2);
        let sum = 0;
        for (let i = 0; i < p1.length; i++) {
            sum += (p2[i] - p1[i]) ** 2;
        }
        return Math.sqrt(sum);
    },
    /**
     * Calculates the magnitude of an n-dimensional array
     * @param vector
     * @returns The magnitude of the vector
     */
    magnitude: function (vector: Vector): number {
        [vector] = math.matchVectors(vector);
        return Math.sqrt(vector.reduce((p, c) => p + c ** 2, 0));
    },
    /**
     * Normalizes an n-dimensional vector to have a magnitude of 1, preserving the direction
     * @param vector
     * @returns Normalized vector, +1/-1 if vector is number, or undefined if vector magnitude is 0
     */
    normalize: function (vector: number | Vector): number | Vector {
        if (typeof vector === "number") {
            return Math.abs(vector) / vector;
        } else {
            const mag = math.magnitude(vector);
            return mag === 0 ? NaN : vector.map((x) => x / mag);
        }
    },
    /**
     * Adds any number of vectors element-wise
     * @param vectors Term vectors
     * @returns Sum vector
     */
    add: function (...vectors: (number | Vector)[]): number | Vector {
        if (vectors.length === 1) return vectors[0];
        const allVectors = math.matchVectors(...vectors);
        const result: Vector = [];
        for (let i = 0; i < allVectors[0].length; i++) {
            result.push(allVectors.map((v) => v[i]).reduce((p, c) => p + c, 0));
        }
        return result;
    },
    /**
     * Multiplies any number of vectors element-wise
     * @param vectors Factor vectors
     * @returns Product vector
     */
    multiply: function (...vectors: (number | Vector)[]): number | Vector {
        if (vectors.length === 1) return vectors[0];
        const allVectors = math.matchVectors(...vectors);
        const result: Vector = [];
        for (let i = 0; i < allVectors[0].length; i++) {
            result.push(allVectors.map((v) => v[i]).reduce((p, c) => p * c, 1));
        }
        return result;
    },
    /**
     * Subtracts all vectors from the first vector element-wise
     * @param  {...number[]} vectors range[0]uend vector, ...subtrahend vectors
     * @returns {number[]} Difference vector
     */
    subtract: function (...vectors: (number | Vector)[]): number | Vector {
        if (vectors.length === 1) return vectors[0];
        const allVectors = math.matchVectors(...vectors);
        const result: Vector = [];
        for (let i = 0; i < allVectors[0].length; i++) {
            result.push(
                allVectors
                    .slice(1)
                    .map((v) => v[i])
                    .reduce((p, c) => p - c, allVectors[0][i])
            );
        }
        return result;
    },
    divide: function (...vectors: (number | Vector)[]): number | Vector {
        if (vectors.length === 1) return vectors[0];
        const allVectors = math.matchVectors(...vectors);
        const result: Vector = [];
        for (let i = 0; i < allVectors[0].length; i++) {
            result.push(
                allVectors
                    .slice(1)
                    .map((v) => v[i])
                    .reduce((p, c) => p / c, allVectors[0][i])
            );
        }
        return result;
    },
};
