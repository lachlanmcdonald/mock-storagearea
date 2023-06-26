/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import LocalStorageArea from '../areas/LocalStorageArea';
import onChangedFactory from './onChangedFactory';
import { serialise } from './serialiser';

describe('onChangedFactory()', () => {
	let chrome = {} as {
		local: LocalStorageArea,
		onChanged: ReturnType<typeof onChangedFactory>
	};

	beforeEach(() => {
		const localArea = new LocalStorageArea([
			['testKey', serialise(1234)],
			['otherKey', serialise(512)],
		]);

		chrome = {
			local: localArea,
			onChanged: onChangedFactory([localArea]),
		};
	});

	test('Can call addListener()', () => {
		expect(() => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			chrome.onChanged.addListener((changes, namespace) => {
				return;
			});
		});
	});

	test('Listen to set() when a value is changed', done => {
		chrome.onChanged.addListener((changes, namespace) => {
			expect(namespace).toBe('local');
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

	test('Listener is when clear() is called', done => {
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
