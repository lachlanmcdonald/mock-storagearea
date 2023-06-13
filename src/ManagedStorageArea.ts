/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import StorageArea from './StorageArea';

export default class ManagedStorageArea extends StorageArea {
	__areaName = 'managed';

	clear(): Promise<void> {
		try {
			throw new Error(`clear() Cannot mutate a managed storage area.`);
		} catch (e) {
			return Promise.reject(e);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	remove(keys: string | string[]): Promise<void> {
		try {
			throw new Error(`remove() Cannot mutate a managed storage area.`);
		} catch (e) {
			return Promise.reject(e);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	set(items: Record<string, any>): Promise<void> {
		try {
			throw new Error(`set() Cannot mutate a managed storage area.`);
		} catch (e) {
			return Promise.reject(e);
		}
	}
}
