/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */

/**
 * Recursively merges the `over` object over the `under` object. Values are only updated
 * when `undefined`.
 *
 * @param under {object} Object to update
 * @param over {object} Input object
 */
export default function deepMergeObjects(under: any, over: any) {
	const temp = {} as Record<string, any>;

	Object.getOwnPropertyNames(under).forEach(key => {
		if (Object.hasOwn(over, key)) {
			if (typeof over[key] === 'object') {
				if (over[key] === null || Array.isArray(over[key]) || typeof over[key] === 'function') {
					temp[key] = structuredClone(over[key]);
				} else if (typeof under[key] === 'object') {
					temp[key] = deepMergeObjects(under[key], over[key]);
				} else {
					temp[key] = structuredClone(over[key]);
				}
			} else if (typeof over[key] !== 'undefined') {
				temp[key] = over[key];
			} else if (typeof under[key] !== 'undefined') {
				temp[key] = under[key];
			}
		} else if (typeof under[key] === 'object') {
			temp[key] = structuredClone(under[key]);
		} else if (typeof under[key] !== 'undefined') {
			temp[key] = under[key];
		}
	});

	Object.getOwnPropertyNames(over).forEach(key => {
		if (Object.hasOwn(temp, key) === false) {
			if (typeof over[key] === 'object') {
				if (over[key] === null || Array.isArray(over[key]) || typeof over[key] === 'function') {
					temp[key] = structuredClone(over[key]);
				} else if (typeof temp[key] === 'object') {
					temp[key] = deepMergeObjects(temp[key], over[key]);
				} else {
					temp[key] = structuredClone(over[key]);
				}
			} else if (typeof over[key] !== 'undefined') {
				temp[key] = over[key];
			}
		}
	});

	return temp;
}
