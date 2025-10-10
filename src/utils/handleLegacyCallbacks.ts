/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HandleLegacyCallback = (...args: any[]) => void;

export default function handleLegacyCallbacks<T>(op: () => T, callback: HandleLegacyCallback | null) {
	if (typeof callback === 'function') {
		throw new Error('Callbacks are unsupported.');
	}

	try {
		return op();
	} catch (e: unknown) {
		return Promise.reject(e);
	}
}
