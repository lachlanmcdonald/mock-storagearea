/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
/* eslint-disable func-style */
import { UNLIMITED_QUOTA } from './Constants';
import OnChangedEvent from './OnChangedEvent';
import Store from './Store';
import { Changes, Quota } from './Types';
import deepMergeObjects from './utils/deepMergeObjects';
import handleLegacyCallbacks from './utils/handleLegacyCallbacks';
import updateWriteQuota from './utils/updateWriteQuota';

type GetParameterKeys = string | string[] | Record<string, any> | null;
type GetParameterCallback = (items: Record<string, any>) => void;

const dispatchEvent = (dispatcher: (changes: Record<string, chrome.storage.StorageChange>) => void, changes: Changes) => {
	const temp = {} as Record<string, {
		oldValue: any;
		newValue: any;
	}>;

	for (const key in changes.changes) {
		if (Object.hasOwn(changes.changes, key)) {
			const k = changes.changes[key];

			temp[key] = {
				oldValue: k.before.exists ? k.before.value : undefined, // eslint-disable-line no-undefined
				newValue: k.after.exists ? k.after.value : undefined, // eslint-disable-line no-undefined
			};
		}
	}

	dispatcher(temp);
};

const STORAGE_AREA_MAP : WeakMap<chrome.storage.StorageArea, {
	writeOperationsPerHour: Record<string, number>,
	writeOperationsPerMinute: Record<string, number>,
	quota: Quota,
	store: Store,
}> = new WeakMap();

export const inspect = (storageArea: chrome.storage.StorageArea) => {
	return STORAGE_AREA_MAP.has(storageArea) ? STORAGE_AREA_MAP.get(storageArea) : null;
};

export default function createStorageArea<Q extends Partial<Quota>>(initialStore?: Store | null, quotas?: Q) : chrome.storage.StorageArea & Q {
	/**
	 * Internal quota limits.
	 */
	const mergedQuotas: Quota = {
		...UNLIMITED_QUOTA,
		...quotas || {},
	};

	/**
	 * Internal store.
	 */
	const store = initialStore ? initialStore : new Store();

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

	function getKeys() {
		return Promise.resolve(Array.from(store.keys()));
	}

	function get(callback: GetParameterCallback) : void;
	function get(keys?: GetParameterKeys) : Promise<Record<string, any>>;
	function get(keys: GetParameterKeys, callback: GetParameterCallback) : void;
	function get(keysOrCallback?: GetParameterKeys | GetParameterCallback, optCallback?: GetParameterCallback) : void | Promise<Record<string, any>> {
		let keys : Record<string, any> | null;
		let callback : GetParameterCallback | null;

		// Handle first parameter
		if (typeof keysOrCallback === 'string') {
			keys = [keysOrCallback];
			callback = null;
		} else if (Array.isArray(keysOrCallback)) {
			const nonStringIndex = keysOrCallback.findIndex(x => typeof x !== 'string');

			if (nonStringIndex > -1) {
				throw new TypeError('Error in invocation of storage.get(optional [string|array|object] keys, function callback): Error at parameter "keys": Value did not match any choice.');
			} else {
				keys = keysOrCallback;
				callback = null;
			}
		} else if (typeof keysOrCallback === 'object') {
			keys = keysOrCallback;
			callback = null;
		} else if (typeof keysOrCallback === 'undefined') {
			keys = null;
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

		const op = () => {
			const lookup = {} as Record<string, { default?: any }>;

			if (keys === null) {
				Array.from(store.keys()).forEach(key => {
					lookup[key] = {};
				});
			} else if (typeof keys === 'string') {
				lookup[keys] = {};
			} else if (Array.isArray(keys)) {
				keys.forEach((key, index) => {
					if (typeof key !== 'string') {
						throw new TypeError(`get() Argument 1 must be a string, string[] or an object of key/value pairs. Received an array with a non-string element at index ${ index }: ${ typeof key }`);
					}
					lookup[key] = {};
				});
			} else {
				Object.getOwnPropertyNames(keys).forEach(key => {
					lookup[key] = {
						default: keys![key],
					};
				});
			}

			const results = {} as Record<string, any>;

			Object.keys(lookup).forEach(key => {
				const hasDefault = Object.hasOwn(lookup[key], 'default');

				if (store.has(key)) {
					let temp = store.get(key);

					if (typeof temp === 'object') {
						if (hasDefault) {
							temp = deepMergeObjects(lookup[key].default, temp);
						}
					}

					results[key] = temp;
				} else if (hasDefault) {
					results[key] = lookup[key].default;
				}
			});

			return results;
		};

		return handleLegacyCallbacks(op, callback ? callback : null);
	}

	function remove(keys: string | string[]): Promise<void>;
	function remove(keys: string | string[], callback: () => void): void;
	function remove(keys: string | string[], callback?: () => void): void | Promise<void> {
		const op = () => {
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
			const changes = store.delete(keys);

			store.data = changes.after.data;
			dispatchEvent(dispatch, changes);
		};

		return handleLegacyCallbacks(op, callback ? callback : null);
	}

	function set(items: Record<string, any>): Promise<void>;
	function set(items: Record<string, any>, callback: () => void): void;
	function set(items: Record<string, any>, callback?: () => void): void | Promise<void> {
		const op = () => {
			const {
				MAX_WRITE_OPERATIONS_PER_HOUR,
				MAX_WRITE_OPERATIONS_PER_MINUTE,
				MAX_ITEMS,
				QUOTA_BYTES,
				QUOTA_BYTES_PER_ITEM,
			} = mergedQuotas;

			updateWriteQuota(MAX_WRITE_OPERATIONS_PER_HOUR, MAX_WRITE_OPERATIONS_PER_MINUTE, writeOperationsPerHour, writeOperationsPerMinute);

			const changes = store.set(items);

			if (changes.after.count > MAX_ITEMS) {
				throw new Error(`Quota exceeded: MAX_ITEMS (${ MAX_ITEMS }) was exceeded. Previous size: ${ changes.before.count }, new size: ${ changes.after.count }.`);
			} else if (changes.after.totalBytes > QUOTA_BYTES) {
				throw new Error(`Quota exceeded: QUOTA_BYTES (${ QUOTA_BYTES }) was exceeded. Previous size: ${ changes.before.sizeInBytes }, new size: ${ changes.after.sizeInBytes }`);
			} else {
				const { sizeInBytes } = changes.after;

				Object.keys(sizeInBytes).forEach(key => {
					if (sizeInBytes[key] > QUOTA_BYTES_PER_ITEM) {
						throw new Error(`Quota exceeded: QUOTA_BYTES_PER_ITEM (${ QUOTA_BYTES_PER_ITEM }) was exceeded by property "${ key }" (${ sizeInBytes[key] })`);
					}
				});

				store.data = changes.after.data;
				dispatchEvent(dispatch, changes);
			}
		};

		return handleLegacyCallbacks(op, callback ? callback : null);
	}

	function clear(): Promise<void>;
	function clear(callback: () => void): void;
	function clear(callback?: () => void): void | Promise<void> {
		const op = () => {
			const {
				MAX_WRITE_OPERATIONS_PER_HOUR,
				MAX_WRITE_OPERATIONS_PER_MINUTE,
			} = mergedQuotas;

			updateWriteQuota(MAX_WRITE_OPERATIONS_PER_HOUR, MAX_WRITE_OPERATIONS_PER_MINUTE, writeOperationsPerHour, writeOperationsPerMinute);
			const changes = store.clear();

			store.data = changes.after.data;
			dispatchEvent(dispatch, changes);
		};

		return handleLegacyCallbacks(op, callback ? callback : null);
	}

	function getBytesInUse(callback: (bytesInUse: number) => void) : void;
	function getBytesInUse(keys?: string | string[] | null) : Promise<number>;
	function getBytesInUse(keys: string | string[] | null, callback: (bytesInUse: number) => void) : void;
	function getBytesInUse(keysOrCallback?: ((bytesInUse: number) => void) | string | string[] | null, optCallback?: (bytesInUse: number) => void) : void | Promise<number> {
		let keys : Array<string> | null;
		let callback : ((bytesInUse: number) => void) | null;

		// Handle first parameter
		if (typeof keysOrCallback === 'string') {
			keys = [keysOrCallback];
			callback = null;
		} else if (Array.isArray(keysOrCallback)) {
			const nonStringIndex = keysOrCallback.findIndex(x => typeof x !== 'string');

			if (nonStringIndex > -1) {
				throw new TypeError(`getBytesInUse() Argument 1 must be null, string, or string[]. Received an array with a non-string element at index ${ nonStringIndex }: ${ typeof keysOrCallback[nonStringIndex] }`);
			} else {
				keys = keysOrCallback;
				callback = null;
			}
		} else if (typeof keysOrCallback === 'undefined') {
			keys = null;
			callback = null;
		} else if (typeof keysOrCallback === 'function') {
			keys = null;
			callback = keysOrCallback;
		} else if (keysOrCallback === null) {
			keys = null;
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

		const op = () => {
			if (keys === null) {
				return store.totalBytes;
			} else {
				const sizeInBytes = store.sizeInBytes;

				const total = keys.reduce((temp, key) => {
					if (Object.hasOwn(sizeInBytes, key)) {
						temp += sizeInBytes[key];
					}

					return temp;
				}, 0);

				return total;
			}
		};

		return handleLegacyCallbacks(op, callback);
	}

	function setAccessLevel(accessOptions: { accessLevel: chrome.storage.AccessLevel }) : Promise<void>;
	function setAccessLevel(accessOptions: { accessLevel: chrome.storage.AccessLevel }, callback: () => void) : void;
	function setAccessLevel(_accessOptions: { accessLevel: chrome.storage.AccessLevel }, callback?: () => void) : Promise<void> | void {
		// eslint-disable-next-line no-empty-function
		return handleLegacyCallbacks(() => {}, callback ? callback : null);
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
