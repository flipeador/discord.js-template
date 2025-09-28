// ESLint Flat Configuration File.
// https://eslint.org/docs/latest/use/configure/configuration-files

import { defineConfig } from 'eslint/config';

// Tool for inspecting ESLint flat configs.
// https://github.com/eslint/config-inspector
// pnpm dlx @eslint/config-inspector

// Global identifiers from different JavaScript environments.
// https://github.com/sindresorhus/globals
import globals from 'globals';

// Stylistic Formatting for ESLint.
// https://eslint.style/packages/default
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig(
    {
        languageOptions: {
            globals: {
                Temporal: false,
                ...globals.node
            }
        },
        plugins: {
           '@stylistic': stylistic
        },
        rules: {
            'class-methods-use-this': 'warn',
            'constructor-super': 'error',
            'default-case-last': 'error',
            'eqeqeq': ['error', 'smart'],
            'for-direction': 'error',
            'getter-return': 'error',
            'new-cap': 'error',
            'no-case-declarations': 'error',
            'no-class-assign': 'error',
            'no-compare-neg-zero': 'error',
            'no-const-assign': 'error',
            'no-constant-binary-expression': 'error',
            'no-constant-condition': 'error',
            'no-delete-var': 'error',
            'no-dupe-args': 'error',
            'no-dupe-class-members': 'error',
            'no-dupe-else-if': 'error',
            'no-dupe-keys': 'error',
            'no-duplicate-case': 'error',
            'no-empty': 'error',
            'no-empty-character-class': 'error',
            'no-empty-pattern': 'error',
            'no-empty-static-block': 'error',
            'no-extra-bind': 'error',
            'no-extra-boolean-cast': 'error',
            'no-global-assign': 'error',
            'no-invalid-regexp': 'error',
            'no-irregular-whitespace': 'error',
            'no-loss-of-precision': 'error',
            'no-misleading-character-class': 'error',
            'no-multi-str': 'error',
            'no-new-native-nonconstructor': 'error',
            'no-new-wrappers': 'error',
            'no-nonoctal-decimal-escape': 'error',
            'no-obj-calls': 'error',
            'no-object-constructor': 'error',
            'no-octal': 'error',
            'no-octal-escape': 'error',
            'no-redeclare': 'error',
            'no-regex-spaces': 'error',
            'no-self-assign': 'error',
            'no-setter-return': 'error',
            'no-sparse-arrays': 'error',
            'no-this-before-super': 'error',
            'no-undef': 'error',
            'no-unexpected-multiline': 'error',
            'no-unneeded-ternary': 'error',
            'no-unreachable': 'error',
            'no-unsafe-finally': 'error',
            'no-unsafe-negation': 'error',
            'no-unsafe-optional-chaining': 'error',
            'no-unused-labels': 'warn',
            'no-unused-private-class-members': 'warn',
            'no-unused-vars': 'warn',
            'no-useless-assignment': 'error',
            'no-useless-backreference': 'error',
            'no-useless-catch': 'error',
            'no-useless-computed-key': 'error',
            'no-useless-concat': 'error',
            'no-useless-constructor': 'error',
            'no-useless-escape': 'error',
            'no-useless-return': 'error',
            'no-var': 'error',
            'no-with': 'error',
            'prefer-const': 'error',
            'require-yield': 'error',
            'unicode-bom': 'error',
            'use-isnan': 'error',
            'valid-typeof': 'error',
            // ESLint Stylistic
            '@stylistic/function-call-spacing': 'error',
            '@stylistic/key-spacing': 'error',
            '@stylistic/keyword-spacing': 'error',
            '@stylistic/new-parens': 'error',
            '@stylistic/no-extra-semi': 'error',
            '@stylistic/no-floating-decimal': 'error',
            '@stylistic/no-tabs': 'error',
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/no-whitespace-before-property': 'error',
            '@stylistic/quotes': ['error', 'single'],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/semi-spacing': 'error',
            '@stylistic/semi-style': ['error', 'last'],
            '@stylistic/switch-colon-spacing': 'error',
            '@stylistic/template-tag-spacing': 'error'
        }
    }
);
