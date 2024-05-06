/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */

import handleLegacyCallbacks from './handleLegacyCallbacks';

const SAFE_OP = () : boolean => {
	return true;
};
const UNSAFE_OP = () : boolean => {
	throw new TypeError('Something went wrong.');
};

beforeEach(() => {
	if (globalThis.chrome && globalThis.chrome.runtime) {
		expect(globalThis.chrome.runtime.lastError).toBeUndefined();
	}
});

afterEach(() => {
	if (globalThis.chrome && globalThis.chrome.runtime) {
		expect(globalThis.chrome.runtime.lastError).toBeUndefined();
	}
});

describe('Using callbacks', () => {
	test('A synchronous function which returns', (done) => {
		handleLegacyCallbacks(SAFE_OP, (result) => {
			expect(result).toBe(true);
			done();
		});
	});

	test('A synchronous function which throws', (done) => {
		handleLegacyCallbacks(UNSAFE_OP, () => {
			expect(globalThis.chrome.runtime.lastError).toBeInstanceOf(TypeError);
			expect(globalThis.chrome.runtime.lastError?.message).toBe('Something went wrong.');
			done();
		});
	});

	test('Throws if passed a promise', () => {
		expect(() => {
			// @ts-expect-error Argument is intentionally invalid
			handleLegacyCallbacks(Promise.resolve(), () => {}); // eslint-disable-line no-empty-function
		}).toThrow(new TypeError('handleLegacyCallbacks() does not support asynchronous functions. Argument 1 is a promise.'));
	});

	test('Throws if passed a function which returns a promise', () => {
		expect(() => {
			handleLegacyCallbacks(() => {
				return Promise.resolve();
			}, () => {}); // eslint-disable-line no-empty-function
		}).toThrow(new TypeError('handleLegacyCallbacks() does not support asynchronous functions. Argument 1 returned a promise.'));
	});
});

describe('Using promises', () => {
	test('A synchronous function which returns', () => {
		expect(handleLegacyCallbacks(SAFE_OP, null)).resolves.toBe(true);
	});

	test('A synchronous function which throws', () => {
		expect(handleLegacyCallbacks(UNSAFE_OP, null)).rejects.toThrow(new TypeError('Something went wrong.'));
	});

	test('Throws if passed a promise', () => {
		expect(() => {
			// @ts-expect-error Argument is intentionally invalid
			handleLegacyCallbacks(Promise.resolve(), null);
		}).toThrow(new TypeError('handleLegacyCallbacks() does not support asynchronous functions. Argument 1 is a promise.'));
	});

	test('Throws if passed a function which returns a promise', () => {
		expect(() => {
			handleLegacyCallbacks(() => {
				return Promise.resolve();
			}, null);
		}).toThrow(new TypeError('handleLegacyCallbacks() does not support asynchronous functions. Argument 1 returned a promise.'));
	});
});
