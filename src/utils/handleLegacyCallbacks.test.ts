/* eslint-disable no-empty-function */
/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */

import handleLegacyCallbacks from './handleLegacyCallbacks';

const SAFE_OP = () => {
	return Promise.resolve(true);
};

const UNSAFE_OP = () => {
	return Promise.reject(new TypeError('Something went wrong.'));
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

describe('Using callbacks will always throw', () => {
	test('A synchronous function which returns', () => {
		expect(() => {
			handleLegacyCallbacks(SAFE_OP, () => {});
		}).toThrow(/callbacks are unsupported/i);
	});

	test('A synchronous function which throws', () => {
		expect(() => {
			handleLegacyCallbacks(UNSAFE_OP, () => {});
		}).toThrow(/callbacks are unsupported/i);
	});
});

describe('Resolves', () => {
	test('A synchronous function which returns', () => {
		expect(() => {
			return handleLegacyCallbacks(SAFE_OP, null);
		}).resolves.toBe(true);
	});

	test('A synchronous function which throws', () => {
		expect(() => {
			return handleLegacyCallbacks(UNSAFE_OP, null);
		}).rejects.toThrow(/Something went wrong/i);
	});
});
