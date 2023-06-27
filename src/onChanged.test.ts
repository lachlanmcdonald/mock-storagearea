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

describe.skip('onChanged()', () => {
	let chrome = {} as Chrome;

	beforeEach(() => {
		const store = new Store([
			['testKey', serialise(1234)],
			['otherKey', serialise(512)],
		]);

		const sessionArea = SessionStorageArea();
		const localArea = LocalStorageArea(store);

		chrome = {
			local: localArea,
			session: sessionArea,
			onChanged: onChanged({
				local: localArea,
				session: sessionArea,
			}),
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
			expect(changes).toHaveProperty('testKey');
			expect(changes).toMatchObject({
				testKey: {
					oldValue: 1234,
					newValue: 4567,
				},
			});

			done();
		});

		expect(chrome.local.set({
			testKey: 4567,
		})).resolves.not.toThrowError();
	});

	test('Listener is called when a value is added', done => {
		chrome.onChanged.addListener(changes => {
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

	test('Listener is called when a value is removed', done => {
		chrome.onChanged.addListener(changes => {
			expect(changes).toMatchObject({
				testKey: {
					oldValue: 1234,
					newValue: undefined, // eslint-disable-line no-undefined
				},
			});

			done();
		});

		expect(chrome.local.remove(['testKey'])).resolves.not.toThrowError();
	});

	test('Listener is called on clear()', done => {
		chrome.onChanged.addListener(changes => {
			expect(changes).toMatchObject({
				testKey: {
					oldValue: 1234,
					newValue: undefined, // eslint-disable-line no-undefined
				},
				otherKey: {
					oldValue: 512,
					newValue: undefined, // eslint-disable-line no-undefined
				},
			});

			done();
		});

		expect(chrome.local.clear()).resolves.not.toThrowError();
	});
});
