/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import MapStore from './MapStore';

export interface Quota {
	MAX_ITEMS: number
	MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE: number
	MAX_WRITE_OPERATIONS_PER_HOUR: number
	MAX_WRITE_OPERATIONS_PER_MINUTE: number
	QUOTA_BYTES: number
	QUOTA_BYTES_PER_ITEM: number
}

/**
 * @TODO There will be two OnChangedListener's as one will include an `areaName`.
 */
export type OnChangedListener = (changes: Record<string, chrome.storage.StorageChange>, areaName?: string) => void;

export type PropertyChanges = Record<string, {
	before: {
		value: string | null
		exists: boolean
	}
	after: {
		value: string | null
		exists: boolean
	}
}>;

export type Changes = {
	before: MapStore
	after: MapStore
	changes: PropertyChanges
};

/**
 * Change description from a Store
 */
export type StoreChange = {
	key: string;
	before: {
		exists: boolean;
		value: any;
	};
	after: {
		exists: boolean;
		value: any;
	};
};

/**
 * InternalStore
 */
export interface InternalStore {
	serialiser: SerialiseFunction;
	deserialiser: DeserialiseFunction;

	has(key: string): Promise<boolean>;
	get(key: string): Promise<any>;
	set(payload: Record<string, any>): Promise<StoreChange[]>;
	delete(key: string): Promise<StoreChange[]>;
	clear(): Promise<StoreChange[]>;
	sizeInBytes(): Promise<Record<string, number>>;
	totalBytes(): Promise<number>;
	count(): Promise<number>;
	keys(): Promise<Array<string>>;
	values(): Promise<Array<any>>;
	entries(): Promise<Array<[string, string]>>;
}

/**
 * Deserialises a value previously serialised by {@link SerialiseFunction}.
 */
export type DeserialiseFunction = (value: string) => any;

/**
 * A function which serialises a value for storage within a Storage Area.
 * - If a string is returned, the property has been successfully serialised.
 * - If `null` is returned, the property should be omitted. Please note that serialise() may also
 *   return the string `"null"`, which as per above, means the value of `null` was successfully serialised.
 */
export type SerialiseFunction = (value: unknown, parentIsArray?: boolean, parentIsObject?: boolean, seenObjects?: Set<any> | null) => string | null;

