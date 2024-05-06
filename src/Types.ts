/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import Store from './Store';

export interface Quota {
	MAX_ITEMS: number
	MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE: number
	MAX_WRITE_OPERATIONS_PER_HOUR: number
	MAX_WRITE_OPERATIONS_PER_MINUTE: number
	QUOTA_BYTES: number
	QUOTA_BYTES_PER_ITEM: number
}

export type StorageChanges = Record<string, {
	/** The old value of the item, if any. */
	oldValue?: any;

	/** The new value of the item, if any. */
	newValue?: any;
}>;

/**
 * @TODO There will be two OnChangedListener's as one will include an `areaName`.
 */
export type OnChangedListener = (changes: StorageChanges, areaName?: string) => void;

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
	before: Store
	after: Store
	changes: PropertyChanges
};
