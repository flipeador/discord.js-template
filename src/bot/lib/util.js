import fs from 'node:fs';
import fsp from 'node:fs/promises';
import util from 'node:util';
import crypto from 'node:crypto';

export { fs, fsp };
export const node = util;

// https://github.com/nodejs/help/issues/1808
export const AsyncFunction = async function () {}.constructor;

export function log(...args) {
    args = args.map(arg => {
        if (typeof(arg) === 'string')
            return arg;
        return util.inspect(arg, {
            depth: null,
            colors: true,
            numericSeparator: true
        });
    });
    console.log(...args);
}

/**
 * Shorten a string by adding a suffix.
 * @param {string} str
 * @param {number} limit
 * @param {string} suffix
 * @returns {string}
 */
export function shorten(str, limit, suffix='…') {
    if (limit >= str.length) return str;
    if (limit < suffix.length) return '';
    return str.slice(0, limit-suffix.length) + suffix;
}

/**
 * Replace text in a string based on provided pairs of substrings and values.
 * @param {string} str
 */
export function replace(str, ...pairs) {
    let lkv; // last known value
    pairs.forEach(([substr, value], i) => {
        lkv = value ?? lkv ?? pairs[i-1][1];
        str = str.replace(substr, lkv);
    });
    return str;
}

/**
 * Remove all indentation from each line of a multiline string.
 */
export function stripIndents(str) {
    str = str.split('\n').slice(1, -1);
    const indent = Math.min(
        ...str.filter(str => str.trim())
            .map(str => str.match(/^\s*/)[0].length)
    );
    return str.map(s => s.slice(indent)).join('\n');
}

/**
 * Check if a string has only letters.
 * @param {string} str
 */
export function isLetter(str) {
    return !/[^\p{Letter}\p{Mark}]+/gu.test(str);
}

export function serialize(value, space) {
    return JSON.stringify(
        value,
        (_, value) => {
            if (Error.isError(value))
                return Object.assign(
                    {
                        name: value.name,
                        message: value.message,
                        stack: value.stack,
                        cause: value.cause,
                        __type: 'Error'
                    },
                    value
                );
            return value;
        },
        space
    );
}

export function deserialize(value) {
    if (typeof(value) !== 'string') return;

    return JSON.parse(value, (_, value) => {
        if (typeof(value) === 'object' && value?.__type) {
            const type = value.__type;
            delete value.__type;
            if (type === 'Error')
                return Object.assign(
                    new Error(undefined,
                        'cause' in value ?
                        { cause: value.cause } :
                        { }
                    ),
                    value
                );
        }
        return value;
    });
}

/**
 * Evaluate a function and returns its result.
 */
export function evalfn(fn, ...args) {
    fn = Function(`return(${fn}\n)(...arguments)`);
    return fn(...args);
}

/**
 * Generate a cryptographically strong random number in a given range.
 */
export function random(min, max) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const value = array[0] / (0xFFFFFFFF + 1);
    return Math.floor(value * (max - min + 1)) + min;
}

/**
 * Choose a random element from an array.
 * @param {Array} array
 * @param {boolean} [remove]
 * Whether to remove the chosen element from the array.
 */
export function choise(array, remove) {
    const index = random(0, array.length-1);
    if (!remove) return array[index];
    return array.splice(index, 1)[0];
}

/**
 * @param {number} min
 * @param {number} [max]
 * @returns {Promise<number>}
 */
export function timeout(min, max) {
    const ms = max === undefined ? min : random(min, max);
    return new Promise(r => setTimeout(() => r(Date.now()), ms));
}

/**
 * Parse a string to determine a time duration.
 * @param {string} str
 * The input string representing a duration or a date.
 * @returns {number}
 * The duration, in milliseconds.
 */
export function duration(str) {
    if (str.search(/[/-]/) !== -1)
        return Date.parse(`${str} UTC`) - Date.now();

    const units = { d: 86400000, h: 3600000, m: 60000, s: 1000 };

    return str.matchAll(/\b(\d+)(d|h|m|s)\b/g).reduce(
        (total, m) => total + Number(m[1]) * units[m[2]],
        0
    );
}

/**
 * Load JSON data from a file.
 */
export async function load(path, defval) {
    if (defval !== undefined && !fs.existsSync(path))
        return typeof(defval) === 'function' ? defval() : defval;
    return deserialize(await fsp.readFile(path, { encoding: 'utf8' }));
}

/**
 * Dump JSON data to a file.
 */
export async function dump(path, data, space) {
    data = serialize(data, space);
    return fsp.writeFile(path, data, { encoding: 'utf8' });
}
