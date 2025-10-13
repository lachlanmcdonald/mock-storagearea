/* eslint-disable func-style */
/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import { UNLIMITED_QUOTA } from './Constants';
import MapStore from './MapStore';
import OnChangedEvent from './OnChangedEvent';
import { InternalStore, Quota, StoreChange } from './Types';
import deepMergeObjects from './utils/deepMergeObjects';
import handleLegacyCallbacks from './utils/handleLegacyCallbacks';
import updateWriteQuota from './utils/updateWriteQuota';

type GetParameterKeys = string | string[] | Record<string, unknown> | null;
type GetParameterCallback = (items: Record<string, unknown>) => void;

const dispatchEvent = (dispatcher: (changes: Record<string, chrome.storage.StorageChange>) => void, changes: StoreChange[]) => {
	const temp = {} as Record<string, {
		oldValue: unknown;
		newValue: unknown;
	}>;

	for (const k of changes) {
		temp[k.key] = {
			oldValue: k.before.exists ? k.before.value : undefined, // eslint-disable-line no-undefined
			newValue: k.after.exists ? k.after.value : undefined, // eslint-disable-line no-undefined
		};
	}

	dispatcher(temp);
};

const STORAGE_AREA_MAP : WeakMap<chrome.storage.StorageArea, {
	writeOperationsPerHour: Record<string, number>,
	writeOperationsPerMinute: Record<string, number>,
	quota: Quota,
	store: InternalStore,
}> = new WeakMap();

export const inspect = (storageArea: chrome.storage.StorageArea) => {
	return STORAGE_AREA_MAP.has(storageArea) ? STORAGE_AREA_MAP.get(storageArea) : null;
};

export default function createStorageArea<Q extends Partial<Quota>>(initialStore?: InternalStore | null, quotas?: Q) : chrome.storage.StorageArea & Q {
	/**
	 * Internal quota limits.
	 */
	const mergedQuotas: Quota = {
		...UNLIMITED_QUOTA,
		...(quotas || {}),
	};

	/**
	 * Internal store.
	 */
	const store : InternalStore = initialStore ? initialStore : new MapStore();

	/**
	 * Event handlers
	 */
	const {
		dispatch,
		external: onChanged,
	} = OnChangedEvent();

	/**
	 * A key-value pair, key represents a range of time (i.e. the current hour) and
	 * value is the number of operations performed for that range.
	 */
	const writeOperationsPerHour = {} as Record<string, number>;

	/**
	 * A key-value pair, key represents a range of time (i.e. the current hour) and
	 * value is the number of operations performed for that range.
	 */
	const writeOperationsPerMinute = {} as Record<string, number>;

	async function getKeys() {
		return Array.from(await store.keys());
	}

	function get(callback: GetParameterCallback) : void;
	function get(keys?: GetParameterKeys) : Promise<Record<string, unknown>>;
	function get(keys: GetParameterKeys, callback: GetParameterCallback) : void;
	function get(keysOrCallback?: GetParameterKeys | GetParameterCallback, optCallback?: GetParameterCallback) : void | Promise<Record<string, unknown>> {
		let keyArrayOrObject : string[] | Record<string, unknown> | null;
		let callback : GetParameterCallback | null;

		// Handle first parameter
		if (typeof keysOrCallback === 'string') {
			keyArrayOrObject = [keysOrCallback];
			callback = null;
		} else if (Array.isArray(keysOrCallback)) {
			const nonStringIndex = keysOrCallback.findIndex(x => typeof x !== 'string');

			if (nonStringIndex > -1) {
				throw new TypeError('Error in invocation of storage.get(optional [string|array|object] keys, function callback): Error at parameter "keys": Value did not match any choice.');
			} else {
				keyArrayOrObject = keysOrCallback;
				callback = null;
			}
		} else if (typeof keysOrCallback === 'object') {
			keyArrayOrObject = keysOrCallback;
			callback = null;
		} else if (typeof keysOrCallback === 'undefined') {
			keyArrayOrObject = null;
			callback = null;
		} else {
			throw new TypeError('Error in invocation of storage.get(optional [string|array|object] keys, function callback): Error at parameter "keys": Value did not match any choice.');
		}

		// Handle second parameter
		if (callback === null) {
			if (typeof optCallback === 'function') {
				callback = optCallback;
			} else if (typeof optCallback !== 'undefined') {
				throw new TypeError('Error in invocation of storage.get(optional [string|array|object] keys, function callback): No matching signature.');
			}
		}

		const op = async () => {
			const lookup : Record<string, { default?: unknown }> = {};

			if (keyArrayOrObject === null) {
				Array.from(await store.keys()).forEach(key => {
					lookup[key] = {};
				});
			} else if (typeof keyArrayOrObject === 'string') {
				lookup[keyArrayOrObject] = {};
			} else if (Array.isArray(keyArrayOrObject)) {
				keyArrayOrObject.forEach((key, index) => {
					if (typeof key === 'string') {
						lookup[key] = {};
					} else {
						throw new TypeError(`get() Argument 1 must be a string, string[] or an object of key/value pairs. Received an array with a non-string element at index ${ index }: ${ typeof key }`);
					}
				});
			} else {
				Object.getOwnPropertyNames(keyArrayOrObject).forEach(key => {
					lookup[key] = {
						default: keyArrayOrObject![key],
					};
				});
			}

			const results = {} as Record<string, unknown>;
			const promises: Array<Promise<void>> = [];

			for (const key of Object.keys(lookup)) {
				const hasDefaultValue = Object.hasOwn(lookup[key], 'default');

				promises.push(store.has(key).then(async hasKey => {
					if (hasKey) {
						let temp = await store.get(key);

						if (typeof temp === 'object') {
							if (hasDefaultValue) {
								temp = deepMergeObjects(lookup[key].default, temp);
							}
						}

						results[key] = temp;
					} else {
						results[key] = lookup[key].default;
					}
				}));
			}

			await Promise.all(promises);
			return results;
		};

		return handleLegacyCallbacks(op, callback || null);
	}

	function remove(keys: string | string[]): Promise<void>;
	function remove(keys: string | string[], callback: () => void): void;
	function remove(keys: string | string[], callback?: () => void): void | Promise<void> {
		const op = async () => {
			if (typeof keys === 'string') {
				keys = [keys];
			} else if (Array.isArray(keys)) {
				const nonStringIndex = keys.findIndex(x => typeof x !== 'string');

				if (nonStringIndex > -1) {
					throw new TypeError(`remove() Argument 1 must be a string or string[]. Received an array with a non-string element at index ${ nonStringIndex }: ${ typeof keys[nonStringIndex] }`);
				}
			} else {
				throw new TypeError(`remove() Argument 1 must be a string or string[]. Received: ${ typeof keys }`);
			}

			const {
				MAX_WRITE_OPERATIONS_PER_HOUR,
				MAX_WRITE_OPERATIONS_PER_MINUTE,
			} = mergedQuotas;

			updateWriteQuota(MAX_WRITE_OPERATIONS_PER_HOUR, MAX_WRITE_OPERATIONS_PER_MINUTE, writeOperationsPerHour, writeOperationsPerMinute);

			const changes = await store.delete(keys);

			dispatchEvent(dispatch, changes);
		};

		return handleLegacyCallbacks(op, callback || null);
	}

	function set(items: Record<string, unknown>): Promise<void>;
	function set(items: Record<string, unknown>, callback: () => void): void;
	function set(items: Record<string, unknown>, callback?: () => void): void | Promise<void> {
		const op = async () => {
			const {
				MAX_WRITE_OPERATIONS_PER_HOUR,
				MAX_WRITE_OPERATIONS_PER_MINUTE,
				MAX_ITEMS,
				QUOTA_BYTES,
				QUOTA_BYTES_PER_ITEM,
			} = mergedQuotas;

			updateWriteQuota(MAX_WRITE_OPERATIONS_PER_HOUR, MAX_WRITE_OPERATIONS_PER_MINUTE, writeOperationsPerHour, writeOperationsPerMinute);

			const previousCount = await store.count();
			const previousTotalBytes = await store.totalBytes();

			const changes = await store.set(items);

			const newCount = await store.count();
			const newTotalBytes = await store.totalBytes();

			if (newCount > MAX_ITEMS) {
				throw new Error(`Quota exceeded: MAX_ITEMS (${ MAX_ITEMS }) was exceeded. Previous size: ${ previousCount }, new size: ${ newCount }.`);
			} else if (newTotalBytes > QUOTA_BYTES) {
				throw new Error(`Quota exceeded: QUOTA_BYTES (${ QUOTA_BYTES }) was exceeded. Previous size: ${ previousTotalBytes }, new size: ${ newTotalBytes }`);
			} else {
				const sizeInBytes = await store.sizeInBytes();

				Object.keys(sizeInBytes).forEach(key => {
					if (sizeInBytes[key] > QUOTA_BYTES_PER_ITEM) {
						throw new Error(`Quota exceeded: QUOTA_BYTES_PER_ITEM (${ QUOTA_BYTES_PER_ITEM }) was exceeded by property "${ key }" (${ sizeInBytes[key] })`);
					}
				});

				dispatchEvent(dispatch, changes);
			}
		};

		return handleLegacyCallbacks(op, callback || null);
	}

	function clear(): Promise<void>;
	function clear(callback: () => void): void;
	function clear(callback?: () => void): void | Promise<void> {
		const operation = async () => {
			const {
				MAX_WRITE_OPERATIONS_PER_HOUR,
				MAX_WRITE_OPERATIONS_PER_MINUTE,
			} = mergedQuotas;

			updateWriteQuota(MAX_WRITE_OPERATIONS_PER_HOUR, MAX_WRITE_OPERATIONS_PER_MINUTE, writeOperationsPerHour, writeOperationsPerMinute);

			const changes = await store.clear();

			dispatchEvent(dispatch, changes);
		};

		return handleLegacyCallbacks(operation, callback || null);
	}

	function getBytesInUse(callback: (bytesInUse: number) => void) : void;
	function getBytesInUse(keys?: string | string[] | null) : Promise<number>;
	function getBytesInUse(keys: string | string[] | null, callback: (bytesInUse: number) => void) : void;
	function getBytesInUse(keysOrCallback?: ((bytesInUse: number) => void) | string | string[] | null, optCallback?: (bytesInUse: number) => void) : void | Promise<number> {
		let keyArrayOrObject : Array<string> | null;
		let callback : ((bytesInUse: number) => void) | null;

		// Handle first parameter
		if (typeof keysOrCallback === 'string') {
			keyArrayOrObject = [keysOrCallback];
			callback = null;
		} else if (Array.isArray(keysOrCallback)) {
			const nonStringIndex = keysOrCallback.findIndex(x => typeof x !== 'string');

			if (nonStringIndex > -1) {
				throw new TypeError(`getBytesInUse() Argument 1 must be null, string, or string[]. Received an array with a non-string element at index ${ nonStringIndex }: ${ typeof keysOrCallback[nonStringIndex] }`);
			} else {
				keyArrayOrObject = keysOrCallback;
				callback = null;
			}
		} else if (typeof keysOrCallback === 'undefined') {
			keyArrayOrObject = null;
			callback = null;
		} else if (typeof keysOrCallback === 'function') {
			keyArrayOrObject = null;
			callback = keysOrCallback;
		} else if (keysOrCallback === null) {
			keyArrayOrObject = null;
			callback = null;
		} else {
			throw new TypeError(`Error in invocation of storage.getBytesInUse(optional [string|array] keys, function callback): No matching signature: Argument 1 must be null, string, string[] or function. Received: ${ typeof keysOrCallback }`);
		}

		// Handle second parameter
		if (callback === null) {
			if (typeof optCallback === 'function') {
				callback = optCallback;
			} else if (typeof optCallback !== 'undefined') {
				throw new TypeError(`Error in invocation of storage.getBytesInUse(optional [string|array] keys, function callback): No matching signature: Argument 2 must be a function. Received: ${ typeof optCallback }`);
			}
		}

		const op = async () => {
			if (keyArrayOrObject === null) {
				return store.totalBytes();
			} else {
				const sizeInBytes = await store.sizeInBytes();

				return keyArrayOrObject.reduce((temp, key) => {
					if (Object.hasOwn(sizeInBytes, key)) {
						temp += sizeInBytes[key];
					}

					return temp;
				}, 0);
			}
		};

		return handleLegacyCallbacks(op, callback);
	}

	function setAccessLevel(_accessOptions: { accessLevel: chrome.storage.AccessLevel }) : Promise<void>;
	function setAccessLevel(_accessOptions: { accessLevel: chrome.storage.AccessLevel }, callback: () => void) : void;
	function setAccessLevel(_accessOptions: { accessLevel: chrome.storage.AccessLevel }, callback?: () => void) : Promise<void> | void {
		return handleLegacyCallbacks(() => Promise.resolve(), callback || null);
	}

	// Where a quota exists, ensure that it is included in the return value.
	const obj = {
		clear,
		getBytesInUse,
		getKeys,
		get,
		remove,
		set,
		setAccessLevel,
		onChanged,
	} as chrome.storage.StorageArea & Q;

	for (const key in mergedQuotas) {
		if (Object.hasOwn(mergedQuotas, key)) {
			const k = mergedQuotas[key as keyof Quota];

			// Do not export infinite quotas
			if (Number.isFinite(k)) {
				obj[key as keyof Quota] = k;
			}
		}
	}

	// Store a weak reference to this object for inspection-purposes
	STORAGE_AREA_MAP.set(obj, {
		writeOperationsPerHour,
		writeOperationsPerMinute,
		quota: mergedQuotas,
		store,
	});

	return obj;
}
