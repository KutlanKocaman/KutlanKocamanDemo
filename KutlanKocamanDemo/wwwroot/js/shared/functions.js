﻿/**
 * Returns a multi-dimensional array. Each argument is the length of a dimension.
 * @param {any} length
 */
export function createMultiDimensionalArray(length) {
    let arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        let args = Array.prototype.slice.call(arguments, 1);
        while (i--) arr[length - 1 - i] = createMultiDimensionalArray.apply(this, args);
    }

    return arr;
}

/**
 * Returns a deep copy/clone of the simple or nested object passed in.
 * @param {any} input
 */
export function createDeepCopy(input) {
    let output, value, key

    //Return the value if object is not an object
    if (typeof input !== "object" || input === null) {
        return input;
    }

    //If the object is a Set then copy the Set and return it.
    if (input.constructor.name === 'Set') {
        output = new Set();
        for (let item of input) {
            output.add(createDeepCopy(item));
        }
    }
    //If the input is another kind of object or an array, copy it and return it.
    else {
        output = Array.isArray(input) ? [] : {};
        for (key in input) {
            value = input[key];

            //Recursively deep copy nested objects.
            let result = createDeepCopy(value);
            output[key] = result;
        }
    }
    return output;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * @param {any} min
 * @param {any} max
 */
export function randomBetweenInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}