/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import { UNLIMITED_QUOTA } from './Constants';
import Store from './Store';

/**
 * A function which serialises a value for storage within a Storage Area.
 * - If a string is returned, the property has been successfully serialised.
 * - If `null` is returned, the property should be omitted. Please note that serialise() may also
 *   return the string `"null"`, which as per above, means the value of `null` was successfully serialised.
 */
export type SerialiserFunction = (value: unknown, parentIsArray?: boolean, parentIsObject?: boolean) => string | null

/**
 * Deserialises a value previously serialised by {@link SerialiserFunction}.
 */
export type DeserialiserFunction = (value: string) => any

export interface StorageAreaQuota {
	MAX_ITEMS: number
	MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE: number
	MAX_WRITE_OPERATIONS_PER_HOUR: number
	MAX_WRITE_OPERATIONS_PER_MINUTE: number
	QUOTA_BYTES: number
	QUOTA_BYTES_PER_ITEM: number
	writeOperationsPerHour: Record<string, number>
	writeOperationsPerMinute: Record<string, number>
}

export interface StorageChange {
	/** The old value of the item, if any. */
	oldValue?: any;
	/** The new value of the item, if any. */
	newValue?: any;
}

export type StorageChanges = Record<string, StorageChange>

/**
 * @TODO There will be two OnChangedListener's as one will include an `areaName`.
 */
export type OnChangedListener = (changes: StorageChanges) => void;

export type Quota = keyof typeof UNLIMITED_QUOTA

export type Quotas = Partial<Record<Quota, number>>

export enum AccessLevel {
	TRUSTED_CONTEXTS = 'TRUSTED_CONTEXTS',
	TRUSTED_AND_UNTRUSTED_CONTEXTS = 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
}

export type SetAccessLevelOptions = Partial<{
	accessLevel?: AccessLevel,
}>;

export type PropertyChanges = Record<string, {
	before: {
		value: string | null
		exists: boolean
	}
	after: {
		value: string | null
		exists: boolean
	}
}>

export type Changes = {
	before: Store
	after: Store
	changes: PropertyChanges
}
