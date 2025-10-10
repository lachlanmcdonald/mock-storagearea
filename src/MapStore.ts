/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import { DeserialiseFunction, InternalStore, SerialiseFunction, StoreChange } from './Types';
import { deserialise } from './utils/deserialise';
import { serialise } from './utils/serialiser';

/**
 * A __Store__ represents the underlying data structure of a {@link StorageArea}.
 *
 * - Any operation which modifies the __Store__ (`.set()` or `.delete()`) will
 *   not modify the instance itself, but return a new instance with the modifications
 *   and changes, allowing the result to be inspected.
 * - Values in the __Store__ are serialised using using {@link serialise}, and as such,
 *   some values may throw an exception or be ignored.
 */
export default class MapStore implements InternalStore {
	serialiser: SerialiseFunction;
	deserialiser: DeserialiseFunction;
	data: Map<string, string>;

	/**
	 * Initialises a new instance of Store with the optional payload
	 * used as the initial store. The payload can be any value accepted by the __Map__ constructor,
	 * The values of payload must be serialised (using {@link serialise}).
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(payload?: Iterable<any>, serialiser?: SerialiseFunction, deserialiser?: DeserialiseFunction) {
		this.data = new Map(payload || []);
		this.serialiser = serialiser || serialise;
		this.deserialiser = deserialiser || deserialise;
	}

	/**
	 * Returns whether the store contains the provided key.
	 */
	has(key: string) {
		try {
			return Promise.resolve(this.data.has(key));
		} catch (e: unknown) {
			return Promise.reject(e);
		}
	}

	/**
	 * Retrieves the value for the provided key from the store. Will throw
	 * a __RangeError__ if the key does not exist within the store.
	 */
	get(key: string) {
		try {
			if (this.data.has(key)) {
				return Promise.resolve(this.deserialiser(this.data.get(key) as string));
			} else {
				throw new RangeError(`key does not exist in store: ${ key }`);
			}
		} catch (e: unknown) {
			return Promise.reject(e);
		}
	}

	/**
	 * Sets values within the store. The payload should be an object of key/value pairs, where
	 * the value is deserialised (as it will be serialised during import.)
	 */
	set(payload: Record<string, unknown>) {
		try {
			const changes: Array<StoreChange> = [];

			for (const key in payload) {
				if (Object.hasOwn(payload, key)) {
					const serialisedValue = this.serialiser(payload[key]);

					if (typeof serialisedValue === 'string') {
						const existBefore = this.data.has(key);

						changes.push({
							key,
							before: {
								exists: existBefore,
								value: existBefore ? this.deserialiser(this.data.get(key) as string) : null,
							},
							after: {
								exists: true,
								value: payload[key],
							},
						});

						this.data.set(key, serialisedValue);
					}
				}
			}

			return Promise.resolve(changes);
		} catch (e: unknown) {
			return Promise.reject(e);
		}
	}

	/**
	 * Removes an item or items from the store.
	 */
	delete(keys: string | string[]) {
		try {
			if (typeof keys === 'string') {
				keys = [keys];
			}

			const changes: Array<StoreChange> = [];

			keys.forEach(key => {
				const existBefore = this.data.has(key);

				changes.push({
					key,
					before: {
						exists: existBefore,
						value: existBefore ? this.deserialiser(this.data.get(key) as string) : null,
					},
					after: {
						exists: false,
						value: null,
					},
				});

				this.data.delete(key);
			});

			return Promise.resolve(changes);
		} catch (e: unknown) {
			return Promise.reject(e);
		}
	}

	/**
	 * Removes all items from the store.
	 */
	clear() {
		return this.delete(Array.from(this.data.keys()));
	}

	/**
	 * Returns the size of each property in the store in bytes. The size is calculated as the
	 * string length of the key plus the string length of the serialised value for every item
	 * in the store.
	 */
	sizeInBytes() {
		try {
			const result = {} as Record<string, number>;

			for (const key of this.data.keys()) {
				const value = this.data.get(key);

				if (typeof value === 'string') {
					result[key] = key.length + value.length;
				}
			}

			return Promise.resolve(result);
		} catch (e: unknown) {
			return Promise.reject(e);
		}
	}

	/**
	 * Returns the total size of the store in bytes. The size is calculated as the
	 * string length of the key plus the string length of the serialised value
	 * for every item in the store.
	 */
	async totalBytes() {
		try {
			return Promise.resolve(Object.values(await this.sizeInBytes()).reduce((k, v) => {
				return k + v;
			}, 0));
		} catch (e: unknown) {
			return Promise.reject(e);
		}
	}

	count() {
		try {
			return Promise.resolve(this.data.size);
		} catch (e: unknown) {
			return Promise.reject(e);
		}
	}

	keys() {
		try {
			return Promise.resolve(Array.from(this.data.keys()));
		} catch (e: unknown) {
			return Promise.reject(e);
		}
	}

	values() {
		try {
			return Promise.resolve(Array.from(this.data.values()));
		} catch (e: unknown) {
			return Promise.reject(e);
		}
	}

	entries() {
		try {
			return Promise.resolve(Array.from(this.data.entries()));
		} catch (e: unknown) {
			return Promise.reject(e);
		}
	}
}
