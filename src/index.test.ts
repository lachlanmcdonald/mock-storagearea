/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import {
	CHROME_LOCAL_STORAGE_DEFAULT_QUOTA,
	CHROME_MANAGED_STORAGE_DEFAULT_QUOTA,
	CHROME_SESSION_STORAGE_DEFAULT_QUOTA,
	CHROME_SYNC_STORAGE_DEFAULT_QUOTA,
	createLocalStorageArea,
	createManagedStorageArea,
	createSessionStorageArea,
	createStorageArea,
	createSyncStorageArea,
	deserialise,
	inspect,
	MapStore,
	onChanged,
	serialise,
	UNLIMITED_QUOTA
} from './index';

const IMPORTS = [
	['CHROME_LOCAL_STORAGE_DEFAULT_QUOTA', CHROME_LOCAL_STORAGE_DEFAULT_QUOTA],
	['CHROME_MANAGED_STORAGE_DEFAULT_QUOTA', CHROME_MANAGED_STORAGE_DEFAULT_QUOTA],
	['CHROME_SESSION_STORAGE_DEFAULT_QUOTA', CHROME_SESSION_STORAGE_DEFAULT_QUOTA],
	['CHROME_SYNC_STORAGE_DEFAULT_QUOTA', CHROME_SYNC_STORAGE_DEFAULT_QUOTA],
	['createLocalStorageArea', createLocalStorageArea],
	['createManagedStorageArea', createManagedStorageArea],
	['createSessionStorageArea', createSessionStorageArea],
	['createStorageArea', createStorageArea],
	['createSyncStorageArea', createSyncStorageArea],
	['deserialise', deserialise],
	['inspect', inspect],
	['onChanged', onChanged],
	['serialise', serialise],
	['Store', MapStore],
	['UNLIMITED_QUOTA', UNLIMITED_QUOTA],
];

describe('Exports', () => {
	test.each(IMPORTS)('%s', (_name, exported) => {
		expect(exported).toBeTruthy();
	});
});

describe('inspect()', () => {
	test('Can inspect storage areas', () => {
		const k = createLocalStorageArea();

		const meta = inspect(k);

		expect(meta).not.toBeNull();
		expect(meta!.quota).toMatchObject(CHROME_LOCAL_STORAGE_DEFAULT_QUOTA);
	});
});
