/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import { PropertyChanges } from './Types';
import StoreChangeFactory from './utils/StoreChangeFactory';
import { deserialise, serialise, DeserialiserFunction, SerialiserFunction } from './utils/serialiser';

/**
 * A __Store__ represents the underlying data structure of a {@link StorageArea}.
 *
 * Any operation which modifies the __Store__ (`.set()` or `.delete()`) will
 * not modify the instance itself, but return a new instance with the modifications
 * and changes, allowing the result to be inspected.
 *
 * Values in the __Store__ are serialised using using {@link serialise}, and as such,
 * some values may throw an exception or be ignored.
 */
export default class Store {
	serialise: SerialiserFunction;
	deserialise: DeserialiserFunction;
	data: Map<string, string>;

	/**
	 * Initialises a new instance of Store with the optional payload
	 * used as the initial store. The payload can be any value accepted by the __Map__ constructor,
	 * however, the values must be serialised strings (using {@link serialise}).
	 */
	constructor(payload?: Iterable<any>, serialiser?: SerialiserFunction, deserialiser?: DeserialiserFunction) {
		this.data = new Map(payload || []);
		this.serialise = serialiser || serialise;
		this.deserialise = deserialiser || deserialise;
	}

	/**
	 * Initialises a new instance of Store with the same store.
	 */
	clone() {
		return new Store(this.data.entries(), this.serialise, this.deserialise);
	}

	/**
	 * Returns whether the store contains the provided key.
	 */
	has(key: string) {
		return this.data.has(key);
	}

	/**
	 * Retrieves the value for the provided key from the store. Will throw
	 * a __RangeError__ if the key does not exist within the store.
	 */
	get(key: string) {
		if (this.has(key)) {
			return this.deserialise(this.data.get(key) as string);
		} else {
			throw new RangeError(`key does not exist in store: ${ key }`);
		}
	}

	/**
	 * Sets values within the store. The payload should be an object of key/value pairs, where
	 * the value is deserialised (as it will be serialised during import.)
	 */
	set(payload: Record<string, any>) {
		const mutatedStore = this.clone();

		for (const key in payload) {
			if (Object.hasOwn(payload, key)) {
				const serialisedValue = this.serialise(payload[key]);

				if (typeof serialisedValue === 'string') {
					mutatedStore.data.set(key, serialisedValue);
				}
			}
		}

		return StoreChangeFactory(this, mutatedStore);
	}

	/**
	 * Removes an item or items from the store. Removing non-existant items
	 * has no effect.
	 */
	delete(keys: string | string[]) {
		if (typeof keys === 'string') {
			keys = [keys];
		}

		const mutatedStore = this.clone();

		keys.forEach(key => {
			mutatedStore.data.delete(key);
		});

		return StoreChangeFactory(this, mutatedStore);
	}

	/**
	 * Removes all items from the store.
	 */
	clear() {
		const mutatedStore = this.clone();

		mutatedStore.data = new Map();

		return StoreChangeFactory(this, mutatedStore);
	}

	/**
	 * Compares the __Store__ instance with another __Store__, returning
	 * a set of changes which indicate whether properties were added, delete, or updated.
	 */
	compare(input: Store) {
		const results = {} as PropertyChanges;

		const keys = [...this.keys(), ...input.keys()];

		for (const key of keys) {
			const existsBefore = this.has(key);
			const existsAfter = input.has(key);
			let hasChanged = true;
			let valueBefore = null;
			let valueAfter = null;

			if (existsBefore) {
				valueBefore = this.get(key);
			}

			if (existsAfter) {
				valueAfter = input.get(key);
			}

			if (existsBefore && existsAfter) {
				hasChanged = valueBefore !== valueAfter;
			}

			if (hasChanged) {
				results[key] = {
					before: {
						exists: existsBefore,
						value: existsBefore ? valueBefore : null,
					},
					after: {
						exists: existsAfter,
						value: existsAfter ? valueAfter : null,
					},
				};
			}
		}

		return results;
	}

	/**
	 * Returns the size of each property in the store in bytes. The size is calculated as the
	 * string length of the key plus the string length of the serialised value
	 * for every item in the store.
	 */
	get sizeInBytes() {
		const result = {} as Record<string, number>;

		for (const key of this.keys()) {
			const value = this.data.get(key);

			if (typeof value === 'string') {
				result[key] = key.length + value.length;
			}
		}

		return result;
	}

	/**
	 * Returns the total size of the store in bytes.
	 */
	get totalBytes() {
		return Object.values(this.sizeInBytes).reduce((k, v) => k + v, 0);
	}

	/**
	 * Returns the number of items within the store.
	 */
	get count() {
		return this.data.size;
	}

	keys() {
 return this.data.keys();
}

	values() {
 return this.data.values();
}

	entries() {
 return this.data.entries();
}
}
