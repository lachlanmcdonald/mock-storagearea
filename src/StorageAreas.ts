/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import { CHROME_LOCAL_STORAGE_DEFAULT_QUOTA, CHROME_SESSION_STORAGE_DEFAULT_QUOTA, CHROME_SYNC_STORAGE_DEFAULT_QUOTA } from './Constants';
import Store from './Store';
import createStorageArea from './createStorageArea';

export const createLocalStorageArea = (initialStore?: Store): chrome.storage.LocalStorageArea => {
	return createStorageArea(initialStore, CHROME_LOCAL_STORAGE_DEFAULT_QUOTA);
};

export const createSyncStorageArea = (initialStore?: Store): chrome.storage.SyncStorageArea => {
	return createStorageArea(initialStore, CHROME_SYNC_STORAGE_DEFAULT_QUOTA);
};

export const createSessionStorageArea = (initialStore?: Store): chrome.storage.SessionStorageArea => {
	return createStorageArea(initialStore, CHROME_SESSION_STORAGE_DEFAULT_QUOTA);
};

export const createManagedStorageArea = (initialStore?: Store): chrome.storage.StorageArea => {
	/**
	 * Removes all items from the _Storage Area_.
	 */
	const clear = (): Promise<void> => {
		try {
			throw new Error(`clear() Cannot mutate a managed storage area.`);
		} catch (e) {
			return Promise.reject(e);
		}
	};

	/**
	 * Removes one or more items from storage.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const remove = (_keys: string | string[]): Promise<void> => {
		try {
			throw new Error(`remove() Cannot mutate a managed storage area.`);
		} catch (e) {
			return Promise.reject(e);
		}
	};

	/**
	 * Sets multiple items.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const set = (_items: Record<string, any>): Promise<void> => {
		try {
			throw new Error(`set() Cannot mutate a managed storage area.`);
		} catch (e) {
			return Promise.reject(e);
		}
	};

	return Object.freeze({
		...createStorageArea(initialStore),
		clear,
		remove,
		set,
	});
};
