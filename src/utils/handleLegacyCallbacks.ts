/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */

// eslint-disable-next-line consistent-return
export default function handleLegacyCallbacks(op: () => any, callback: ((...args: any[]) => void) | null): Promise<any> | void {
	if (typeof callback === 'function') {
		throw new Error('Callbacks are unsupported.');
	}

	globalThis.chrome = globalThis.chrome || {};
	globalThis.chrome.runtime = globalThis.chrome.runtime || {};

	try {
		if (op instanceof Promise) {
			throw new TypeError('handleLegacyCallbacks() does not support asynchronous functions. Argument 1 is a promise.');
		}

		const result = op();

		if (result instanceof Promise) {
			throw new TypeError('handleLegacyCallbacks() does not support asynchronous functions. Argument 1 returned a promise.');
		}

		return Promise.resolve(result);
	} catch (e: any) {
		if (e.toString().indexOf('handleLegacyCallbacks()') > -1) {
			throw e;
		} else {
			return Promise.reject(e);
		}
	}
}
