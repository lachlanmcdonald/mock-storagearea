/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */

import { Quota } from './Types';

/**
 * Unlimited quota.
 */
export const UNLIMITED_QUOTA : Quota = {
	MAX_ITEMS: Infinity,
	MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE: Infinity,
	MAX_WRITE_OPERATIONS_PER_HOUR: Infinity,
	MAX_WRITE_OPERATIONS_PER_MINUTE: Infinity,
	QUOTA_BYTES: Infinity,
	QUOTA_BYTES_PER_ITEM: Infinity,
};

/**
 * Default quota for local storage.
 */
export const CHROME_LOCAL_STORAGE_DEFAULT_QUOTA : Partial<Quota> = {
	QUOTA_BYTES: 10485760,
};

/**
 * Default quota for session storage.
 */
export const CHROME_SESSION_STORAGE_DEFAULT_QUOTA : Partial<Quota> = {
	QUOTA_BYTES: 10485760,
};

/**
 * Default quota for sync storage.
 */
export const CHROME_SYNC_STORAGE_DEFAULT_QUOTA : Partial<Quota> = {
	MAX_ITEMS: 512,
	MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE: 1000000,
	MAX_WRITE_OPERATIONS_PER_HOUR: 1800,
	MAX_WRITE_OPERATIONS_PER_MINUTE: 120,
	QUOTA_BYTES: 102400,
	QUOTA_BYTES_PER_ITEM: 8192,
};

/**
 * Default quota for managed storage.
 */
export const CHROME_MANAGED_STORAGE_DEFAULT_QUOTA : Partial<Quota> = {};
