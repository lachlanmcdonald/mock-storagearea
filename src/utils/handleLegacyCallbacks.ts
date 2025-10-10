/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */

// eslint-disable-next-line consistent-return
export default async function handleLegacyCallbacks(op: () => any, callback: ((...args: any[]) => void) | null) {
	if (typeof callback === 'function') {
		throw new Error('Callbacks are unsupported.');
	}

	try {
		return await op();
	} catch (e: any) {
		return Promise.reject(e);
	}
}
