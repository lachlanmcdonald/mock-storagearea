/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import { UNLIMITED_QUOTA } from './Constants';
import OnChangedEventTarget from './OnChangedEventTarget';
import Store from './Store';
import { DeserialiserFunction, Payload, Quotas, SerialiserFunction, SetAccessLevelOptions } from './Types';
import incrementWriteQuota from './utils/incrementWriteQuota';
import notifyEventTargets from './utils/notifyEventTargets';
import deepMergeObjects from './utils/deepMergeObjects';

export default class StorageArea {
	/**
	 * Internal storage of the StorageArea.
	 *
	 * __Note:__ This member is not part of the SDK and should only
	 * be used for debugging purposes.
	 */
	__unsafeInternalStore: Store;

	/**
	 * Listeners that are notified when the internal storage is
	 * successfully altered.
	 *
	 * __Note:__ This member is not part of the SDK and should only
	 * be used for debugging purposes.
	 */
	__eventTargets: Set<OnChangedEventTarget>;

	/**
	 * Information about quota limits and usage.
	 *
	 * __Note:__ This member is not part of the SDK and should only
	 * be used for debugging purposes.
	 */
	__quotas: {
		MAX_ITEMS: number,
		MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE: number,
		MAX_WRITE_OPERATIONS_PER_HOUR: number,
		MAX_WRITE_OPERATIONS_PER_MINUTE: number,
		QUOTA_BYTES: number,
		QUOTA_BYTES_PER_ITEM: number,
		writeOperationsPerHour: Record<string, number>,
		writeOperationsPerMinute: Record<string, number>,
	};

	/**
	 * areaName as it appears within the onChanged callback.
	 *
	 * __Note:__ This member is not part of the SDK and should only
	 * be used for debugging purposes.
	 */
	__areaName = '';

	constructor(payload?: Payload, quotas?: Quotas, serialiser?: SerialiserFunction, deserialiser?: DeserialiserFunction) {
		this.__unsafeInternalStore = new Store(payload, serialiser, deserialiser);
		this.__eventTargets = new Set();
		this.__quotas = {
			...UNLIMITED_QUOTA,
			...quotas || {},
			writeOperationsPerHour: {},
			writeOperationsPerMinute: {},
		};
	}

	/**
	 * Removes all items from storage.
	 */
	clear() {
		try {
			const {
				MAX_WRITE_OPERATIONS_PER_HOUR,
				MAX_WRITE_OPERATIONS_PER_MINUTE,
				writeOperationsPerHour,
				writeOperationsPerMinute,
			} = this.__quotas;

			incrementWriteQuota(MAX_WRITE_OPERATIONS_PER_HOUR, MAX_WRITE_OPERATIONS_PER_MINUTE, writeOperationsPerHour, writeOperationsPerMinute);
			const changes = this.__unsafeInternalStore.clear();

			this.__unsafeInternalStore = changes.after;
			notifyEventTargets(this.__eventTargets, changes, this);
			return Promise.resolve();
		} catch (e) {
			return Promise.reject(e);
		}
	}

	/**
	 * Gets the amount of space (in bytes) being used by one or more items.
	 *
	 * This is calculated as the _length of the key_ plus the _length of the serialised value_.
	 */
	getBytesInUse(keys: null | string | string[]) {
		try {
			if (keys === null) {
				return Promise.resolve(this.__unsafeInternalStore.totalBytes);
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

				const sizeInBytes = this.__unsafeInternalStore.sizeInBytes;

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
	 * Gets one or more items from storage.
	 */
	get(keys: string | string[] | Record<string, any> | null) {
		try {
			const lookup = {} as Record<string, { default?: any }>;

			if (keys === null) {
				Array.from(this.__unsafeInternalStore.keys()).forEach(key => {
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

				if (this.__unsafeInternalStore.has(key)) {
					let temp = this.__unsafeInternalStore.get(key);

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
	remove(keys: string | string[]): Promise<void> {
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
			} = this.__quotas;

			incrementWriteQuota(MAX_WRITE_OPERATIONS_PER_HOUR, MAX_WRITE_OPERATIONS_PER_MINUTE, writeOperationsPerHour, writeOperationsPerMinute);
			const changes = this.__unsafeInternalStore.delete(keys);

			this.__unsafeInternalStore = changes.after;
			notifyEventTargets(this.__eventTargets, changes, this);
			return Promise.resolve();
		} catch (e) {
			return Promise.reject(e);
		}
	}

	/**
	 * Sets multiple items.
	 */
	set(items: Record<string, any>) {
		try {
			const {
				MAX_WRITE_OPERATIONS_PER_HOUR,
				MAX_WRITE_OPERATIONS_PER_MINUTE,
				MAX_ITEMS,
				QUOTA_BYTES,
				QUOTA_BYTES_PER_ITEM,
				writeOperationsPerHour,
				writeOperationsPerMinute,
			} = this.__quotas;

			incrementWriteQuota(MAX_WRITE_OPERATIONS_PER_HOUR, MAX_WRITE_OPERATIONS_PER_MINUTE, writeOperationsPerHour, writeOperationsPerMinute);

			const changes = this.__unsafeInternalStore.set(items);

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

				this.__unsafeInternalStore = changes.after;
				notifyEventTargets(this.__eventTargets, changes, this);
				return Promise.resolve();
			}
		} catch (e) {
			return Promise.reject(e);
		}
	}

	/**
	 * Sets the desired access level for the storage area.
	 *
	 * __Note:__ This method has no effect.
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	setAccessLevel(accessOptions: SetAccessLevelOptions = {}) {
		return Promise.resolve();
	}
}
