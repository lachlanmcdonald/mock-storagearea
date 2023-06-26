/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
/* eslint-disable func-style */
import { CHROME_LOCAL_STORAGE_DEFAULT_QUOTA, CHROME_SESSION_STORAGE_DEFAULT_QUOTA, CHROME_SYNC_STORAGE_DEFAULT_QUOTA, UNLIMITED_QUOTA } from './Constants';
import OnChangedEvent from './OnChangedEvent';
import Store from './Store';
import { Changes, Quotas, SetAccessLevelOptions, StorageAreaQuota, StorageChanges } from './Types';
import deepMergeObjects from './utils/deepMergeObjects';
import incrementWriteQuota from './utils/incrementWriteQuota';

const mergeQuotas = (quotas?: Quotas): StorageAreaQuota => {
	return {
		...UNLIMITED_QUOTA,
		...quotas || {},
		writeOperationsPerHour: {},
		writeOperationsPerMinute: {},
	};
};

const dispatchEvent = (dispatcher: (changes: StorageChanges) => void, changes: Changes) => {
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

export function StorageAreaFactory(initialStore?: Store | null, testQuotas?: Quotas) {
	/**
	 * Internal quota limits and usage.
	 */
	const quotas = mergeQuotas(testQuotas);

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
	 * Removes all items from the _Storage Area_.
	 */
	function clear() {
		try {
			const {
				MAX_WRITE_OPERATIONS_PER_HOUR,
				MAX_WRITE_OPERATIONS_PER_MINUTE,
				writeOperationsPerHour,
				writeOperationsPerMinute,
			} = quotas;

			incrementWriteQuota(MAX_WRITE_OPERATIONS_PER_HOUR, MAX_WRITE_OPERATIONS_PER_MINUTE, writeOperationsPerHour, writeOperationsPerMinute);
			const changes = store.clear();

			store.store = changes.after.store;
			dispatchEvent(dispatch, changes);
			return Promise.resolve();
		} catch (e) {
			return Promise.reject(e);
		}
	}

	/**
	 * Gets the total number of bytes being used by one or more items in the _Storage Area_.
	 */
	function getBytesInUse(keys?: null | string | string[]) {
		try {
			if (keys === null) {
				return Promise.resolve(store.totalBytes);
			} else {
				if (typeof keys === 'string') {
					keys = [keys];
				} else if (Array.isArray(keys)) {
					const nonStringIndex = keys.findIndex(x => typeof x !== 'string');

					if (nonStringIndex > -1) {
						throw new TypeError(`getBytesInUse() Argument 1 must be null, string, or string[]. Received an array with a non-string element at index ${nonStringIndex}: ${typeof keys[nonStringIndex]}`);
					}
				} else {
					throw new TypeError(`getBytesInUse() Argument 1 must be null, string, or string[]. Received: ${typeof keys}`);
				}

				const sizeInBytes = store.sizeInBytes;

				const total = keys.reduce((temp, key) => {
					if (Object.hasOwn(sizeInBytes, key)) {
						temp += sizeInBytes[key];
					}

					return temp;
				}, 0);

				return Promise.resolve(total);
			}
		} catch (e) {
			return Promise.reject(e);
		}
	}

	/**
	 * Gets one or more items from the _Storage Area_.
	 */
	function get(keys: string | string[] | Record<string, any> | null) {
		try {
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
						throw new TypeError(`get() Argument 1 must be a string, string[] or an object of key/value pairs. Received an array with a non-string element at index ${index}: ${typeof key}`);
					}
					lookup[key] = {};
				});
			} else {
				Object.getOwnPropertyNames(keys).forEach(key => {
					lookup[key] = {
						default: keys[key],
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

			return Promise.resolve(results);
		} catch (e) {
			return Promise.reject(e);
		}
	}

	/**
	 * Removes one or more items from storage.
	 */
	function remove(keys: string | string[]): Promise<void> {
		try {
			if (typeof keys === 'string') {
				keys = [keys];
			} else if (Array.isArray(keys)) {
				const nonStringIndex = keys.findIndex(x => typeof x !== 'string');

				if (nonStringIndex > -1) {
					throw new TypeError(`remove() Argument 1 must be a string or string[]. Received an array with a non-string element at index ${nonStringIndex}: ${typeof keys[nonStringIndex]}`);
				}
			} else {
				throw new TypeError(`remove() Argument 1 must be a string or string[]. Received: ${typeof keys}`);
			}

			const {
				MAX_WRITE_OPERATIONS_PER_HOUR,
				MAX_WRITE_OPERATIONS_PER_MINUTE,
				writeOperationsPerHour,
				writeOperationsPerMinute,
			} = quotas;

			incrementWriteQuota(MAX_WRITE_OPERATIONS_PER_HOUR, MAX_WRITE_OPERATIONS_PER_MINUTE, writeOperationsPerHour, writeOperationsPerMinute);
			const changes = store.delete(keys);

			store.store = changes.after.store;
			dispatchEvent(dispatch, changes);
			return Promise.resolve();
		} catch (e) {
			return Promise.reject(e);
		}
	}

	/**
	 * Sets multiple items.
	 */
	function set(items: Record<string, any>) {
		try {
			const {
				MAX_WRITE_OPERATIONS_PER_HOUR,
				MAX_WRITE_OPERATIONS_PER_MINUTE,
				MAX_ITEMS,
				QUOTA_BYTES,
				QUOTA_BYTES_PER_ITEM,
				writeOperationsPerHour,
				writeOperationsPerMinute,
			} = quotas;

			incrementWriteQuota(MAX_WRITE_OPERATIONS_PER_HOUR, MAX_WRITE_OPERATIONS_PER_MINUTE, writeOperationsPerHour, writeOperationsPerMinute);

			const changes = store.set(items);

			if (changes.after.count > MAX_ITEMS) {
				throw new Error(`Quota exceeded: MAX_ITEMS (${MAX_ITEMS}) was exceeded. Previous size: ${changes.before.count}, new size: ${changes.after.count}.`);
			} else if (changes.after.totalBytes > QUOTA_BYTES) {
				throw new Error(`Quota exceeded: QUOTA_BYTES (${QUOTA_BYTES}) was exceeded. Previous size: ${changes.before.sizeInBytes}, new size: ${changes.after.sizeInBytes}`);
			} else {
				const { sizeInBytes } = changes.after;

				Object.keys(sizeInBytes).forEach(key => {
					if (sizeInBytes[key] > QUOTA_BYTES_PER_ITEM) {
						throw new Error(`Quota exceeded: QUOTA_BYTES_PER_ITEM (${QUOTA_BYTES_PER_ITEM}) was exceeded by property "${key}" (${sizeInBytes[key]})`);
					}
				});

				store.store = changes.after.store;
				dispatchEvent(dispatch, changes);
				return Promise.resolve();
			}
		} catch (e) {
			return Promise.reject(e);
		}
	}

	/**
	 * Sets the desired access level for the _Storage Area_.
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function setAccessLevel(accessOptions: SetAccessLevelOptions = {}) {
		return Promise.resolve();
	}

	const quotasConstants = {} as Quotas;

	// Where a quota exists, ensure that it is included in the return value.
	['MAX_ITEMS', 'MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE', 'MAX_WRITE_OPERATIONS_PER_HOUR', 'MAX_WRITE_OPERATIONS_PER_MINUTE', 'QUOTA_BYTES', 'QUOTA_BYTES_PER_ITEM'].forEach(key => {
		if (Object.hasOwn(quotas, key)) {
			const k = quotas[key as keyof Quotas];

			if (Number.isFinite(k)) {
				quotasConstants[key as keyof Quotas] = k;
			}
		}
	});

	return Object.freeze({
		clear,
		getBytesInUse,
		get,
		remove,
		set,
		setAccessLevel,
		onChanged,
		...quotasConstants,
	});
}

export function SyncStorageArea(initialStore?: Store, testQuotas?: Quotas) {
	const quotas = {
		...CHROME_SYNC_STORAGE_DEFAULT_QUOTA,
		...testQuotas || {},
	};

	return StorageAreaFactory(initialStore, quotas);
}

export function LocalStorageArea(initialStore?: Store, testQuotas?: Quotas) {
	const quotas = {
		...CHROME_LOCAL_STORAGE_DEFAULT_QUOTA,
		...testQuotas || {},
	};

	return StorageAreaFactory(initialStore, quotas);
}

export function SessionStorageArea(initialStore?: Store, testQuotas?: Quotas) {
	const quotas = {
		...CHROME_SESSION_STORAGE_DEFAULT_QUOTA,
		...testQuotas || {},
	};

	return StorageAreaFactory(initialStore, quotas);
}

export function ManagedStorageArea(initialStore?: Store, testQuotas?: Quotas) {
	const quotas = {
		...CHROME_LOCAL_STORAGE_DEFAULT_QUOTA,
		...testQuotas || {},
	};

	/**
	 * Removes all items from the _Storage Area_.
	 */
	function clear(): Promise<void> {
		try {
			throw new Error(`clear() Cannot mutate a managed storage area.`);
		} catch (e) {
			return Promise.reject(e);
		}
	}

	/**
	 * Removes one or more items from storage.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function remove(keys: string | string[]): Promise<void> {
		try {
			throw new Error(`remove() Cannot mutate a managed storage area.`);
		} catch (e) {
			return Promise.reject(e);
		}
	}

	/**
	 * Sets multiple items.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function set(items: Record<string, any>): Promise<void> {
		try {
			throw new Error(`set() Cannot mutate a managed storage area.`);
		} catch (e) {
			return Promise.reject(e);
		}
	}

	return Object.freeze({
		...StorageAreaFactory(initialStore, quotas),
		clear,
		remove,
		set,
	});
}
