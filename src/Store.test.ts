/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import Store from './Store';
import { serialise } from './utils/serialiser';

const DEFAULT_STORE = [
	['straw', serialise(true)],
	['state', serialise(false)],
	['final', serialise(12.3977)],
	['pocket', serialise('inside')],
];

describe('.clone()', () => {
	test('Stores are identical after cloning', () => {
		const original = new Store(DEFAULT_STORE);

		const clone = original.clone();

		expect(original.compare(clone)).toMatchObject({});
		expect(original.serialiser).toBe(clone.serialiser);
		expect(original.deserialiser).toBe(clone.deserialiser);
	});
});

describe('.get()', () => {
	test('Returns an deserialised value', () => {
		const k = new Store(DEFAULT_STORE);

		expect(k.get('straw')).toBe(true);
		expect(k.get('state')).toBe(false);
		expect(k.get('final')).toBe(12.3977);
		expect(k.get('pocket')).toBe('inside');
	});

	test('Throws when the key does not exist', () => {
		const k = new Store();

		expect(() => {
			k.get('unknown_key');
		}).toThrow(RangeError);
	});
});

describe('set()', () => {
	test('Setting a new key returns a change description', () => {
		const k = new Store([
			['red', serialise(53)],
			['blue', serialise(49)],
			['green', serialise(21)],
		]);

		const results = k.set({
			yellow: 64,
		});

		expect(results).toMatchObject({
			before: k,
			changes: {
				yellow: {
					before: {
						value: null,
						exists: false,
					},
					after: {
						value: 64,
						exists: true,
					},
				},
			},
		});
	});

	test('Setting an existing key returns a change description', () => {
		const k = new Store([
			['red', serialise(31)],
			['blue', serialise(21)],
			['green', serialise(44)],
		]);

		const results = k.set({
			red: 23,
		});

		expect(results).toMatchObject({
			before: k,
			changes: {
				red: {
					before: {
						value: 31,
						exists: true,
					},
					after: {
						value: 23,
						exists: true,
					},
				},
			},
		});
	});

	test('Setting an existing key to a value that is omitted when serialised results in no change', () => {
		const k = new Store([
			['red', serialise(58)],
			['blue', serialise(90)],
		]);

		const results = k.set({
			red: undefined, // eslint-disable-line no-undefined
			blue: () => {
				return;
			},
		});

		expect(results).toMatchObject({
			before: k,
			changes: {},
		});
	});
});

describe('.delete()', () => {
	test('Deleting an key returns a change description', () => {
		const k = new Store([
			['red', serialise(48)],
			['blue', serialise(89)],
			['green', serialise(96)],
		]);

		const results = k.delete('red');

		expect(results).toMatchObject({
			before: k,
			changes: {
				red: {
					before: {
						value: 48,
						exists: true,
					},
					after: {
						value: null,
						exists: false,
					},
				},
			},
		});
	});

	test('Deleting an array of keys returns a change description', () => {
		const k = new Store([
			['red', serialise(95)],
			['blue', serialise(90)],
			['green', serialise(92)],
		]);

		const results = k.delete(['red', 'blue']);

		expect(results).toMatchObject({
			before: k,
			changes: {
				red: {
					before: {
						value: 95,
						exists: true,
					},
					after: {
						value: null,
						exists: false,
					},
				},
				blue: {
					before: {
						value: 90,
						exists: true,
					},
					after: {
						value: null,
						exists: false,
					},
				},
			},
		});
	});
});

describe('.size', () => {
	test('.size is zero on initialisation', () => {
		const k = new Store();

		expect(k.count).toBe(0);
	});

	test('.size is 1 after value is set', () => {
		const k = new Store();

		expect(k.count).toBe(0);

		const results = k.set({
			test: 123,
		});

		expect(results.after.count).toBe(1);
	});

	test('.size is updated after values are removed', () => {
		const k = new Store([
			['red', serialise(140)],
			['blue', serialise(220)],
			['green', serialise(790)],
		]);

		expect(k.count).toBe(3);

		const results = k.delete(['red', 'blue']);

		expect(results.before.count).toBe(3);
		expect(results.after.count).toBe(1);
	});
});

describe('.totalBytes', () => {
	test('.totalBytes is zero on initialisation', () => {
		const k = new Store();

		expect(k.totalBytes).toBe(0);
	});

	test('.totalBytes increases after value is set', () => {
		const k = new Store();

		expect(k.totalBytes).toBe(0);

		const results = k.set({
			test: 4657,
		});

		expect(results.after.totalBytes).toBe(8);
	});

	test('.totalBytes decreases after value is removed', () => {
		const k = new Store([
			['test', serialise(4657)],
		]);

		const results = k.delete('test');

		expect(results.before.totalBytes).toBe(8);
		expect(results.after.totalBytes).toBe(0);
	});
});

describe('.sizeInBytes', () => {
	test('.sizeInBytes is zero on initialisation', () => {
		const k = new Store();

		expect(k.sizeInBytes).toMatchObject({});
	});

	test('.sizeInBytes increases after value is set', () => {
		const k = new Store();

		const results = k.set({
			test: 4657,
		});

		expect(results.before.sizeInBytes).toMatchObject({});
		expect(results.after.sizeInBytes).toMatchObject({
			test: 8,
		});
	});

	test('.sizeInBytes decreases after value is removed', () => {
		const k = new Store([
			['test', serialise(4657)],
		]);

		const results = k.delete('test');

		expect(results.before.sizeInBytes).toMatchObject({
			test: 8,
		});
		expect(results.after.sizeInBytes).toMatchObject({});
	});
});
