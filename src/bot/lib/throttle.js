/**
 * Throttle class to limit the execution of a function to a specified delay. \
 * Ensures that a function does not execute more than once in a given period.
 */
export class Throttle {
    timer = null;
    timestamp = 0;

    /**
     * Creates a Throttle instance.
     * @param {number} delay
     * The minimum delay between executions, in milliseconds.
     */
    constructor(delay) {
        this.delay = delay;
    }

    /**
     * Clears any pending scheduled execution.
     */
    clear(value, timestamp=0) {
        clearTimeout(this.timer);

        if (value instanceof Error)
            this.reject?.(value);
        else this.resolve?.(value);

        this.timer = null;
        this.timestamp = timestamp;

        delete this.args;
        delete this.reject;
        delete this.resolve;
        delete this.promise;
    }

    /**
     * Executes the provided function.
     * @param {Function} func
     * The function to throttle.
     * @param {...any} args
     * A list of arguments to pass to the function when executed. \
     * The arguments are updated if the function is pending execution.
     * @returns
     * The return value of `func`, or a promise if the function is pending execution.
     */
    execute(func, ...args) {
        if (this.timer) {
            this.func = func;
            this.args = args;
            return this.promise;
        }

        const now = Date.now();
        const timestamp = now - this.timestamp;
        const remaining = this.delay - timestamp;

        if (remaining <= 0) {
            this.timestamp = now;
            return func(...args);
        }

        this.func = func;
        this.args = args;

        this.promise = new Promise((resolve, reject) => {
            Object.assign(this, { resolve, reject });
        });

        this.timer = setTimeout(
            () => {
                Promise.try(this.func, ...this.args).then(this.resolve, this.reject);
                this.clear(undefined, Date.now());
            },
            remaining
        );

        return this.promise;
    }
}
