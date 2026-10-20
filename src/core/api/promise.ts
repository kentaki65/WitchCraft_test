import { Awaited } from "../types";
import { setTimeout } from "@plugins/helpers";

interface PromiseLike<T> {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2>;
}

interface PromiseFulfilledResult<T> {
  status: "fulfilled";
  value: T;
}

interface PromiseRejectedResult {
  status: "rejected";
  reason: any;
}

type PromiseSettledResult<T> =
  | PromiseFulfilledResult<T>
  | PromiseRejectedResult;

type Resolve<T> = (value: T | PromiseLike<T>) => void;
type Reject = (reason?: unknown) => void;
type Executor<T> = (resolve: Resolve<T>, reject: Reject) => void;
type Fulfilled<T, TResult> = (value: T) => TResult | PromiseLike<TResult>;
type Rejected<TResult> = (reason: unknown) => TResult | PromiseLike<TResult>;
type Callback<TResult> = (() => TResult | PromiseLike<TResult>) | null | undefined;

type PromiseState = 0 | 1 | 2 | 3;
type ImmediateFn = (callback: () => void) => void;
type UnhandledRejectionFn = (reason: unknown) => void;

interface Deferred<T = unknown> {
  onFulfilled: ((value: unknown) => unknown) | null;
  onRejected: ((reason: unknown) => unknown) | null;
  promise: PolyfillPromise<T>;
}

export interface PolyfillPromise<T> extends PromiseLike<T> {
  readonly [Symbol.toStringTag]: string;
  _state: PromiseState;
  _handled: boolean;
  _value: unknown;
  _deferreds: Deferred[] | null;
  catch<TResult = never>(onRejected?: Rejected<TResult> | null): PolyfillPromise<T | TResult>;
  finally(onFinally?: (() => void) | null): PolyfillPromise<T>;
  then<TResult1 = T, TResult2 = never>(
    onFulfilled?: Fulfilled<T, TResult1> | null,
    onRejected?: Rejected<TResult2> | null,
  ): PolyfillPromise<TResult1 | TResult2>;
}

interface PolyfillPromiseConstructor {
  new <T>(executor: Executor<T>): PolyfillPromise<T>;
  prototype: PolyfillPromise<unknown>;
  all<T>(values: Iterable<T | PromiseLike<T>> | ArrayLike<T | PromiseLike<T>>): PolyfillPromise<Awaited<T>[]>;
  any<T>(values: Iterable<T | PromiseLike<T>> | ArrayLike<T | PromiseLike<T>>): PolyfillPromise<Awaited<T>>;
  allSettled<T>(values: Iterable<T | PromiseLike<T>> | ArrayLike<T | PromiseLike<T>>): PolyfillPromise<PromiseSettledResult<Awaited<T>>[]>;
  race<T>(values: Iterable<T | PromiseLike<T>> | ArrayLike<T | PromiseLike<T>>): PolyfillPromise<Awaited<T>>;
  resolve<T>(value: T | PromiseLike<T>): PolyfillPromise<Awaited<T>>;
  reject<T = never>(reason?: unknown): PolyfillPromise<T>;
  _immediateFn: ImmediateFn;
  _unhandledRejectionFn: UnhandledRejectionFn;
}

function finallyConstructor<T>(this: PolyfillPromise<T>, callback?: (() => void) | null): PolyfillPromise<T> {
  const Constructor = this.constructor as PolyfillPromiseConstructor;
  return this.then(
    value => Constructor.resolve(callback?.()).then(() => value),
    reason => Constructor.resolve(callback?.()).then(() => Constructor.reject(reason)),
  ) as PolyfillPromise<T>;
}

function allSettled<T>(this: PolyfillPromiseConstructor, values: ArrayLike<T | PromiseLike<T>>): PolyfillPromise<PromiseSettledResult<Awaited<T>>[]> {
  const P = this;
  return new P<PromiseSettledResult<Awaited<T>>[]>( (resolve, reject) => {
    if (!values || typeof values.length === 'undefined') {
      reject(new TypeError(`${typeof values} ${String(values)} is not iterable (cannot read property Symbol(Symbol.iterator))`));
      return;
    }
    const results: PromiseSettledResult<Awaited<T>>[] = Array.prototype.slice.call(values) as PromiseSettledResult<Awaited<T>>[];
    if (results.length === 0) { resolve(results); return; }
    let remaining = results.length;
    const settle = (index: number, input: T | PromiseLike<T>): void => {
      if (input !== null && (typeof input === 'object' || typeof input === 'function')) {
        const then = (input as PromiseLike<T>).then;
        if (typeof then === 'function') {
          then.call(
            input,
            value => { results[index] = { status: 'fulfilled', value: value as Awaited<T> }; if (--remaining === 0) resolve(results); },
            reason => { results[index] = { status: 'rejected', reason }; if (--remaining === 0) resolve(results); },
          );
          return;
        }
      }
      results[index] = { status: 'fulfilled', value: input as Awaited<T> };
      if (--remaining === 0) resolve(results);
    };
    for (let i = 0; i < results.length; i++) settle(i, values[i] as T | PromiseLike<T>);
  });
}

class PolyfillAggregateError extends Error {
  readonly errors: readonly unknown[];
  constructor(errors: readonly unknown[], message = '') {
    super(message);
    this.name = 'AggregateError';
    this.errors = errors;
  }
}

function any<T>(this: PolyfillPromiseConstructor, values: ArrayLike<T | PromiseLike<T>>): PolyfillPromise<Awaited<T>> {
  const P = this;
  return new P<Awaited<T>>((resolve, reject) => {
    if (!values || typeof values.length === 'undefined') { reject(new TypeError('Promise.any accepts an array')); return; }
    const items = Array.prototype.slice.call(values) as Array<T | PromiseLike<T>>;
    if (items.length === 0) { reject(new PolyfillAggregateError([], 'All promises were rejected')); return; }
    const reasons: unknown[] = [];
    for (const item of items) {
      try {
        P.resolve(item).then(resolve, error => {
          reasons.push(error);
          if (reasons.length === items.length) reject(new PolyfillAggregateError(reasons, 'All promises were rejected'));
        });
      } catch (error: unknown) { reject(error); }
    }
  });
}

const setTimeoutFunc = setTimeout;
const isArrayLike = (value: unknown): value is ArrayLike<unknown> =>
  value !== null && (typeof value === 'object' || typeof value === 'function') && 'length' in value;
const noop = (): void => {};

function bind<TArgs extends unknown[], TResult>(fn: (...args: TArgs) => TResult, thisArg: unknown): (...args: TArgs) => TResult {
  return (...args: TArgs): TResult => fn.apply(thisArg, args);
}

const Promise = function <T>(this: PolyfillPromise<T>, executor: Executor<T>): void {
  if (!(this instanceof Promise)) throw new TypeError('Promises must be constructed via new');
  if (typeof executor !== 'function') throw new TypeError('not a function');
  this._state = 0;
  this._handled = false;
  this._value = undefined;
  this._deferreds = [];
  doResolve(executor, this);
} as unknown as PolyfillPromiseConstructor;

function handle(promise: PolyfillPromise<unknown>, deferred: Deferred): void {
  let current = promise;
  while (current._state === 3) current = current._value as PolyfillPromise<unknown>;
  if (current._state === 0) { current._deferreds?.push(deferred); return; }
  current._handled = true;
  Promise._immediateFn(() => {
    const callback = current._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (callback === null) {
      (current._state === 1 ? resolve : reject)(deferred.promise, current._value);
      return;
    }
    try { resolve(deferred.promise, callback(current._value)); }
    catch (error: unknown) { reject(deferred.promise, error); }
  });
}

function resolve<T>(promise: PolyfillPromise<T>, value: unknown): void {
  try {
    if (value === promise) throw new TypeError('A promise cannot be resolved with itself.');
    if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
      const then = (value as { then?: unknown }).then;
      if (value instanceof (Promise as unknown as Function)) {
        promise._state = 3; promise._value = value; finale(promise); return;
      }
      if (typeof then === 'function') { doResolve(bind(then as (resolve: Resolve<unknown>, reject: Reject) => unknown, value), promise); return; }
    }
    promise._state = 1; promise._value = value; finale(promise);
  } catch (error: unknown) { reject(promise, error); }
}

function reject<T>(promise: PolyfillPromise<T>, reason: unknown): void {
  promise._state = 2; promise._value = reason; finale(promise);
}

function finale<T>(promise: PolyfillPromise<T>): void {
  const deferreds = promise._deferreds ?? [];
  if (promise._state === 2 && deferreds.length === 0) {
    Promise._immediateFn(() => { if (!promise._handled) Promise._unhandledRejectionFn(promise._value); });
  }
  for (const deferred of deferreds) handle(promise as PolyfillPromise<unknown>, deferred);
  promise._deferreds = null;
}

function Handler<T, TResult>(onFulfilled: Fulfilled<T, TResult> | null | undefined, onRejected: Rejected<TResult> | null | undefined, promise: PolyfillPromise<TResult>): Deferred<TResult> {
  return {
    onFulfilled: typeof onFulfilled === 'function' ? onFulfilled as (value: unknown) => unknown : null,
    onRejected: typeof onRejected === 'function' ? onRejected as (reason: unknown) => unknown : null,
    promise,
  };
}

function doResolve<T>(executor: Executor<T>, promise: PolyfillPromise<T>): void {
  let done = false;
  try {
    executor(
      value => { if (done) return; done = true; resolve(promise, value); },
      reason => { if (done) return; done = true; reject(promise, reason); },
    );
  } catch (error: unknown) { if (done) return; done = true; reject(promise, error); }
}

Promise.prototype.catch = function <T, TResult = never>(this: PolyfillPromise<T>, onRejected?: Rejected<TResult> | null): PolyfillPromise<T | TResult> {
  return this.then(null, onRejected);
};
Promise.prototype.then = function <T, TResult1 = T, TResult2 = never>(this: PolyfillPromise<T>, onFulfilled?: Fulfilled<T, TResult1> | null, onRejected?: Rejected<TResult2> | null): PolyfillPromise<TResult1 | TResult2> {
  const next = new Promise<unknown>(noop);
  handle(this as PolyfillPromise<unknown>, Handler(onFulfilled as Fulfilled<unknown, unknown> | null | undefined, onRejected as Rejected<unknown> | null | undefined, next));
  return next as PolyfillPromise<TResult1 | TResult2>;
};
Promise.prototype.finally = finallyConstructor;
Object.defineProperty(Promise.prototype, Symbol.toStringTag, {
  value: "Promise",
  configurable: true,
});

Promise.all = function <T>(values: ArrayLike<T | PromiseLike<T>>): PolyfillPromise<Awaited<T>[]> {
  return new Promise<Awaited<T>[]>((resolveAll, rejectAll) => {
    if (!isArrayLike(values)) { rejectAll(new TypeError('Promise.all accepts an array')); return; }
    const items = Array.prototype.slice.call(values) as Array<T | PromiseLike<T>>;
    if (items.length === 0) { resolveAll([]); return; }
    const results = items as unknown as Awaited<T>[];
    let remaining = items.length;
    const settle = (index: number, item: T | PromiseLike<T>): void => {
      try {
        if (item !== null && (typeof item === 'object' || typeof item === 'function')) {
          const then = (item as PromiseLike<T>).then;
          if (typeof then === 'function') { then.call(item, value => { results[index] = value as Awaited<T>; if (--remaining === 0) resolveAll(results); }, rejectAll); return; }
        }
        results[index] = item as Awaited<T>;
        if (--remaining === 0) resolveAll(results);
      } catch (error: unknown) { rejectAll(error); }
    };
    items.forEach((item, index) => settle(index, item));
  });
};
Promise.any = any;
Promise.allSettled = allSettled;
Promise.resolve = function <T>(value: T | PromiseLike<T>): PolyfillPromise<Awaited<T>> {
  if (value && typeof value === 'object' && value.constructor === Promise) return value as PolyfillPromise<Awaited<T>>;
  return new Promise<Awaited<T>>(resolveValue => resolveValue(value as Awaited<T>));
};
Promise.reject = function <T = never>(reason?: unknown): PolyfillPromise<T> {
  return new Promise<T>((_resolve, rejectValue) => rejectValue(reason));
};
Promise.race = function <T>(values: ArrayLike<T | PromiseLike<T>>): PolyfillPromise<Awaited<T>> {
  return new Promise<Awaited<T>>((resolveRace, rejectRace) => {
    if (!isArrayLike(values)) { rejectRace(new TypeError('Promise.race accepts an array')); return; }
    for (let i = 0; i < values.length; i++) Promise.resolve(values[i] as T | PromiseLike<T>).then(resolveRace, rejectRace);
  });
};

const immediateGlobal = globalThis as typeof globalThis & { setImmediate?: (callback: () => void) => unknown };
Promise._immediateFn = (typeof immediateGlobal.setImmediate === 'function'
  ? (callback: () => void): void => { immediateGlobal.setImmediate?.(callback); }
  : (callback: () => void): void => { setTimeoutFunc(callback, 0); });
Promise._unhandledRejectionFn = (reason: unknown): void => {
  if (typeof console !== 'undefined') console.log('Possible Unhandled Promise Rejection:', reason);
};


export { Promise };
export default Promise;
