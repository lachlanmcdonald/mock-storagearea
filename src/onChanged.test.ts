/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import { createLocalStorageArea, createSessionStorageArea } from './StorageAreas';
import Store from './Store';
import onChanged from './onChanged';
import { serialise } from './utils/serialiser';

interface Chrome {
	onChanged: ReturnType<typeof onChanged>,
	storage: {
		local: chrome.storage.LocalStorageArea,
		session: chrome.storage.SessionStorageArea,
	},
}

describe('onChanged()', () => {
	// @ts-expect-error Expect to be incomplete until beforeEach
	let chrome: Chrome = {};

	beforeEach(() => {
		const session = createSessionStorageArea(new Store([
			['apple', serialise('Error')],
			['orange', serialise('Error')],
		]));

		const local = createLocalStorageArea(new Store([
			['apple', serialise(1234)],
			['orange', serialise(512)],
		]));

		chrome = {
			onChanged: onChanged({
				session,
				local,
			}),
			storage: {
				session,
				local,
			},
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

		expect(chrome.storage.local.set({
			apple: 4567,
		})).resolves.not.toThrow();
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

		expect(chrome.storage.local.set({
			newKey: 1234,
		})).resolves.not.toThrow();
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

		expect(chrome.storage.local.remove(['apple'])).resolves.not.toThrow();
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

		expect(chrome.storage.local.clear()).resolves.not.toThrow();
	});
});
