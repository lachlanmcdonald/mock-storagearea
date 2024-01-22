/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import {
	UNLIMITED_QUOTA,
	CHROME_LOCAL_STORAGE_DEFAULT_QUOTA,
	CHROME_SESSION_STORAGE_DEFAULT_QUOTA,
	CHROME_SYNC_STORAGE_DEFAULT_QUOTA,
	LocalStorageArea,
	ManagedStorageArea,
	SessionStorageArea,
	SyncStorageArea,
	deserialise,
	serialise,
	Store,
	onChanged
} from './index';

describe('Exports', () => {
	test('UNLIMITED_QUOTA', () => {
		expect(UNLIMITED_QUOTA).toBeTruthy();
	});

	test('CHROME_LOCAL_STORAGE_DEFAULT_QUOTA', () => {
		expect(CHROME_LOCAL_STORAGE_DEFAULT_QUOTA).toBeTruthy();
	});

	test('CHROME_SESSION_STORAGE_DEFAULT_QUOTA', () => {
		expect(CHROME_SESSION_STORAGE_DEFAULT_QUOTA).toBeTruthy();
	});

	test('CHROME_SYNC_STORAGE_DEFAULT_QUOTA', () => {
		expect(CHROME_SYNC_STORAGE_DEFAULT_QUOTA).toBeTruthy();
	});

	test('LocalStorageArea', () => {
		expect(LocalStorageArea).toBeTruthy();
	});

	test('ManagedStorageArea', () => {
		expect(ManagedStorageArea).toBeTruthy();
	});

	test('SessionStorageArea', () => {
		expect(SessionStorageArea).toBeTruthy();
	});

	test('SyncStorageArea', () => {
		expect(SyncStorageArea).toBeTruthy();
	});

	test('deserialise', () => {
		expect(deserialise).toBeTruthy();
	});

	test('serialise', () => {
		expect(serialise).toBeTruthy();
	});

	test('Store', () => {
		expect(Store).toBeTruthy();
	});

	test('onChanged', () => {
		expect(onChanged).toBeTruthy();
	});
});
