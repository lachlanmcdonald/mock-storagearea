/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import { CHROME_SYNC_STORAGE_DEFAULT_QUOTA } from '../Constants';
import SyncStorageArea from './SyncStorageArea';

describe('Quotas are set to the defaults', () => {
	const tests = Object.entries(CHROME_SYNC_STORAGE_DEFAULT_QUOTA) as Array<[ keyof typeof CHROME_SYNC_STORAGE_DEFAULT_QUOTA, number ]>;

	test.each(tests)('%s is %p', (property, value) => {
		const k = new SyncStorageArea();

		expect(k.__quotas[property]).toBe(value);
	});
});
