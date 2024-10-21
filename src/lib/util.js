import fs from 'node:fs';
import fsp from 'node:fs/promises';
import util from 'node:util';
import crypto from 'node:crypto';

export { fs, fsp };
export const node = util;

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
 */
export function shorten(str, limit, suffix='...') {
    if (limit < suffix.length) return '';
    if (limit >= str.length) return str;
    return str.slice(0, limit-suffix.length) + suffix;
}

/**
 * Removes all indentation from each line of a multiline string.
 */
export function stripIndents(string) {
    string = string.split('\n').slice(1, -1);
    const indent = Math.min(
        ...string.filter(str => str.trim())
        .map(str => str.match(/^\s*/)[0].length)
    );
    return string.map(str => str.slice(indent)).join('\n');
}

export function serialize(value, space) {
    return JSON.stringify(
        value,
        (_, value) => {
            if (value instanceof Error)
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
    return JSON.parse(value, (_, value) => {
        if (value && typeof(value) === 'object' && value.__type === 'Error') {
            delete value.__type;
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
 * Evaluates a function and returns its result.
 */
export function evalfn(fn, ...args) {
    fn = Function(`return (${fn}\n)(...arguments)`);
    return fn(...args);
}

/**
 * Generates a random ID of `length` characters.
 */
export function generateId(length, min=33, max=126) {
    const buffer = crypto.randomBytes(length);
    let id = '', count = max - min + 1;
    while (--length >= 0)
        id += String.fromCodePoint(min + buffer[length] % count);
    return id;
}

/**
 * Generate a random number in a given range.
 */
export function random(min, max) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const value = array[0] / (0xFFFFFFFF + 1);
    return Math.floor(value * (max - min + 1)) + min;
}

export function timeout(min, max) {
    const ms = max === undefined ? min : random(min, max);
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Loads JSON data from a file.
 */
export async function load(path, defval) {
    if (defval !== undefined && !fs.existsSync(path))
        return typeof(defval) === 'function' ? defval() : defval;
    return deserialize(await fsp.readFile(path, { encoding: 'utf8' }));
}

/**
 * Dumps JSON data to a file.
 */
export async function dump(path, data, space) {
    data = serialize(data, space);
    return fsp.writeFile(path, data, { encoding: 'utf8' });
}
