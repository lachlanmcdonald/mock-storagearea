/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import Store from './Store';
import { serialise } from './utils/serialiser';

describe('.clone()', () => {
	test('Stores are identical after cloning', () => {
		const k = new Store([
			['test', serialise(123)],
		]);
		const j = k.clone();

		expect(k.compare(j)).toMatchObject({});

		// @ts-expect-error Intentional access of private member for testing purposes
		expect(k.serialise).toBe(j.serialise);

		// @ts-expect-error Intentional access of private member for testing purposes
		expect(k.deserialise).toBe(j.deserialise);
	});
});

describe('.get()', () => {
	test('Returns an deserialised value', () => {
		const k = new Store([
			['test', serialise(123)],
		]);

		expect(k.get('test')).toBe(123);
	});

	test('Throws when the key does not exist', () => {
		const k = new Store();

		expect(() => {
			k.get('test');
		}).toThrowError(RangeError);
	});
});

describe('set()', () => {
	test('Setting a new key returns a change description', () => {
		const k = new Store([
			['red', serialise(140)],
			['blue', serialise(220)],
			['green', serialise(790)],
		]);

		const results = k.set({
			yellow: 123,
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
						value: 123,
						exists: true,
					},
				},
			},
		});
	});

	test('Setting an existing key returns a change description', () => {
		const k = new Store([
			['red', serialise(140)],
			['blue', serialise(220)],
			['green', serialise(790)],
		]);

		const results = k.set({
			red: 123,
		});

		expect(results).toMatchObject({
			before: k,
			changes: {
				red: {
					before: {
						value: 140,
						exists: true,
					},
					after: {
						value: 123,
						exists: true,
					},
				},
			},
		});
	});

	test('Setting an existing key to a value that is omitted when serialised results in no change', () => {
		const k = new Store([
			['red', serialise(140)],
			['blue', serialise(140)],
		]);

		const results = k.set({
			red: undefined, // eslint-disable-line no-undefined
			blue: () => { return; },
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
			['red', serialise(140)],
			['blue', serialise(220)],
			['green', serialise(790)],
		]);

		const results = k.delete('red');

		expect(results).toMatchObject({
			before: k,
			changes: {
				red: {
					before: {
						value: 140,
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
			['red', serialise(140)],
			['blue', serialise(220)],
			['green', serialise(790)],
		]);

		const results = k.delete(['red', 'blue']);

		expect(results).toMatchObject({
			before: k,
			changes: {
				red: {
					before: {
						value: 140,
						exists: true,
					},
					after: {
						value: null,
						exists: false,
					},
				},
				blue: {
					before: {
						value: 220,
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
