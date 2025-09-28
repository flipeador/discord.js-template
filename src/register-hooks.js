/**
 * Support path mappings from `jsconfig.json`.
 * https://code.visualstudio.com/docs/languages/jsconfig
 *
 * https://nodejs.org/api/module.html#customization-hooks
 * https://nodejs.org/en/blog/release/v23.5.0#on-thread-hooks-are-back
 *
 * Usage:
 *   node --import ./register-hooks.js ./index.js
 */

import { registerHooks } from 'node:module'; // ≥23.5.0
import config from './jsconfig.json' with { type: 'json' };

/**
 * Base directory to resolve non-relative module names.
 */
const baseUrl = import.meta.resolve(config.compilerOptions.baseUrl);

/**
 * Specify path mapping to be computed relative to `baseUrl`.
 */
const paths = config.compilerOptions.paths;

registerHooks({
    resolve(specifier, context, next) {
        if (
            context.parentURL?.startsWith?.(baseUrl) &&
            !context.parentURL.includes('node_modules')
        ) {
            for (const key in paths) {
                const part = key.replace('/*', '/');
                const value = paths[key][0].replace('/*', '/');
                specifier = specifier.replace(part, `${baseUrl}/${value}`);
            }
        }

        return next(specifier, context);
    }
});
