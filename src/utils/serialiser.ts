/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */

/**
 * Serialises the provided value in accordance with the observed serialisation rules in Chrome (which
 * will differ from the serialisation behaviour in the available documentation.)
 *
 * @param parentIsArray Value occurs as an element within an array
 * @param parentIsObject Value occurs as a property within an object
 * @param seenObjects Objects already seen to avoid circular references
 */
export const serialise = (value: unknown, parentIsArray = false, parentIsObject = false, seenObjects : Set<any> | null = null) => {
	seenObjects = seenObjects ? seenObjects : new Set();

	const isPrimitive = ['string', 'boolean'].includes(typeof value);
	const isNumber = typeof value === 'number';
	const isUndefined = typeof value === 'undefined';
	const isSymbol = typeof value === 'symbol';
	const isFunction = typeof value === 'function';
	const isFinite = isNumber && Number.isFinite(value);

	if (isPrimitive) {
		return JSON.stringify(value);
	} else if (isNumber) {
		if (isFinite) {
			return JSON.stringify(value);
		} else {
			return parentIsArray || parentIsObject ? JSON.stringify(null) : null;
		}
	} else if (isUndefined || isSymbol) {
		return parentIsArray || parentIsObject ? JSON.stringify(null) : null;
	} else if (isFunction) {
		return parentIsArray ? JSON.stringify(null) : null;
	} else if (Array.isArray(value)) {
		seenObjects.add(value);

		const results = value.map(x => serialise(x, true, false, seenObjects)) as Array<string>;

		// Cannot use JSON.stringify here as the elements are already stringified and it
		// would result in double-encoding.
		return `[${ results.join() }]`;
	} else if (typeof value === 'object') {
		if (value === null) {
			return JSON.stringify(null);
		} else if (value instanceof RegExp) {
			// Edge-case where an instance of RegExp may have a lastIndex property
			return '{}';
		} else if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
			throw new TypeError(`Unsupported type passed to serialise: ${ typeof value }`);
		} else {
			seenObjects.add(value);

			const properties = Object.getOwnPropertyNames(value) as Array<keyof typeof value>;
			const results = [] as Array<string>;

			for (const property of properties) {
				const k = serialise(value[property], false, true, seenObjects);

				if (typeof k === 'string') {
					results.push(`${ JSON.stringify(property) }:${ k }`);
				}
			}

			// Cannot use JSON.stringify here as the properties are already stringified and it
			// would result in double-encoding.
			return `{${ results.join() }}`;
		}
	} else {
		throw new TypeError(`Unsupported type passed to serialise: ${ typeof value }`);
	}
};

/**
 * A function which serialises a value for storage within a Storage Area.
 * - If a string is returned, the property has been successfully serialised.
 * - If `null` is returned, the property should be omitted. Please note that serialise() may also
 *   return the string `"null"`, which as per above, means the value of `null` was successfully serialised.
 */
export type SerialiseFunction = typeof serialise;
