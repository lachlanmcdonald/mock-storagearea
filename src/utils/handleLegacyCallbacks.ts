/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */

// eslint-disable-next-line consistent-return
export default function handleLegacyCallbacks(op: () => any, callback: ((...args: any[]) => void) | null): Promise<any> | void {
	globalThis.chrome = globalThis.chrome || {};
	globalThis.chrome.runtime = globalThis.chrome.runtime || {};

	try {
		const result = op();

		if (result instanceof Promise) {
			throw new Error('handleLegacyCallbacks() does not support asynchronous functions. Argument 1 returned a promise.');
		}

		if (typeof callback === 'function') {
			delete globalThis.chrome.runtime.lastError;
			callback(result);
		} else {
			return Promise.resolve(result);
		}
	} catch (e: any) {
		if (e.toString().indexOf('handleLegacyCallbacks()') > -1) {
			throw e;
		} else if (typeof callback === 'function') {
			globalThis.chrome.runtime.lastError = e;
			callback();
			delete globalThis.chrome.runtime.lastError;
		} else {
			return Promise.reject(e);
		}
	}
}
