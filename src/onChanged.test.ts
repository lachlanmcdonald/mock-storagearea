/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import { LocalStorageArea, SessionStorageArea } from './StorageAreaFactory';
import Store from './Store';
import onChanged from './onChanged';
import { serialise } from './utils/serialiser';

interface Chrome {
	local: ReturnType<typeof LocalStorageArea>
	session: ReturnType<typeof SessionStorageArea>
	onChanged: ReturnType<typeof onChanged>
}

describe('onChanged()', () => {
	let chrome = {} as Chrome;

	beforeEach(() => {
		const sessionAreaStore = new Store([
			['apple', serialise('Error')],
			['orange', serialise('Error')],
		]);
		const localAreaStore = new Store([
			['apple', serialise(1234)],
			['orange', serialise(512)],
		]);

		const session = SessionStorageArea(sessionAreaStore);
		const local = LocalStorageArea(localAreaStore);

		chrome = {
			session,
			local,
			onChanged: onChanged({ session, local }),
		};
	});

	test('Can call addListener()', () => {
		expect(() => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			chrome.onChanged.addListener((changes, areaName) => {
				return;
			});
		}).not.toThrow();
	});

	test('Listen to set() when a value is changed', done => {
		chrome.onChanged.addListener((changes, areaName) => {
			expect(areaName).toBe('local');
			expect(changes).toHaveProperty('apple');
			expect(changes).toMatchObject({
				apple: {
					oldValue: 1234,
					newValue: 4567,
				},
			});

			done();
		});

		expect(chrome.local.set({
			apple: 4567,
		})).resolves.not.toThrowError();
	});

	test('Callback is called when a value is added', done => {
		chrome.onChanged.addListener((changes, areaName) => {
			expect(areaName).toBe('local');
			expect(changes).toMatchObject({
				newKey: {
					oldValue: undefined, // eslint-disable-line no-undefined
					newValue: 1234,
				},
			});

			done();
		});

		expect(chrome.local.set({
			newKey: 1234,
		})).resolves.not.toThrowError();
	});

	test('Callback is called when a value is removed', done => {
		chrome.onChanged.addListener((changes, areaName) => {
			expect(areaName).toBe('local');
			expect(changes).toMatchObject({
				apple: {
					oldValue: 1234,
					newValue: undefined, // eslint-disable-line no-undefined
				},
			});

			done();
		});

		expect(chrome.local.remove(['apple'])).resolves.not.toThrowError();
	});

	test('Callback is called on clear()', done => {
		chrome.onChanged.addListener((changes, areaName) => {
			expect(areaName).toBe('local');
			expect(changes).toMatchObject({
				apple: {
					oldValue: 1234,
					newValue: undefined, // eslint-disable-line no-undefined
				},
				orange: {
					oldValue: 512,
					newValue: undefined, // eslint-disable-line no-undefined
				},
			});

			done();
		});

		expect(chrome.local.clear()).resolves.not.toThrowError();
	});
});
