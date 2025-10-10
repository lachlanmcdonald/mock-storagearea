/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import MapStore from './MapStore';
import { serialise } from './utils/serialiser';

const DEFAULT_STORE = [
	['straw', serialise(true)],
	['state', serialise(false)],
	['final', serialise(12.3977)],
	['pocket', serialise('inside')],
];

describe('.get()', () => {
	test('Returns an deserialised value', () => {
		const k = new MapStore(DEFAULT_STORE);

		expect(k.get('straw')).resolves.toBe(true);
		expect(k.get('state')).resolves.toBe(false);
		expect(k.get('final')).resolves.toBe(12.3977);
		expect(k.get('pocket')).resolves.toBe('inside');
	});

	test('Throws when the key does not exist', () => {
		const k = new MapStore();

		expect(() => {
			k.get('unknown_key');
		}).rejects.toEqual(RangeError);
	});
});

describe('set()', () => {
	test('Setting a new key returns a change description', async () => {
		const k = new MapStore([
			['red', serialise(53)],
			['blue', serialise(49)],
			['green', serialise(21)],
		]);

		const results = await k.set({
			yellow: 64,
		});

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({
			key: 'yellow',
			before: {
				exists: false,
				value: null,
			},
			after: {
				exists: true,
				value: 64,
			},
		});
	});

	test('Setting an existing key returns a change description', async () => {
		const k = new MapStore([
			['red', serialise(31)],
			['blue', serialise(21)],
			['green', serialise(44)],
		]);

		const results = await k.set({
			red: 23,
		});

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({
			key: 'red',
			before: {
				exists: true,
				value: 31,
			},
			after: {
				exists: true,
				value: 23,
			},
		});
	});

	test('Setting an existing key to a value that is omitted when serialised results in no change', async () => {
		const k = new MapStore([
			['red', serialise(58)],
			['blue', serialise(90)],
		]);

		const results = await k.set({
			red: undefined, // eslint-disable-line no-undefined
			blue: () => {
				return;
			},
		});

		expect(results).toHaveLength(0);
	});
});

describe('.delete()', () => {
	test('Deleting an key returns a change description', async () => {
		const k = new MapStore([
			['red', serialise(48)],
			['blue', serialise(89)],
			['green', serialise(96)],
		]);

		const results = await k.delete('red');

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({
			key: 'red',
			before: {
				exists: true,
				value: 48,
			},
			after: {
				exists: false,
				value: null,
			},
		});
	});

	test('Deleting a non-existent key does nothing', async () => {
		const k = new MapStore([
			['red', serialise(48)],
			['blue', serialise(89)],
			['green', serialise(96)],
		]);

		const results = await k.delete('gold');

		expect(results).toHaveLength(0);
	});

	test('Deleting an array of keys returns a change description', async () => {
		const k = new MapStore([
			['red', serialise(95)],
			['blue', serialise(90)],
			['green', serialise(92)],
		]);

		let results = await k.delete(['red', 'blue']);

		// Sort the results object for comparison
		results = results.sort((a, b) => {
			return a.key.localeCompare(b.key);
		});

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({
			key: 'red',
			before: {
				exists: true,
				value: 95,
			},
			after: {
				exists: false,
				value: null,
			},
		});
		expect(results[1]).toMatchObject({
			key: 'blue',
			before: {
				exists: true,
				value: 90,
			},
			after: {
				exists: false,
				value: null,
			},
		});
	});
});

describe('.size', () => {
	test('.size is zero on initialisation', () => {
		const k = new MapStore();

		expect(k.count()).resolves.toBe(0);
	});

	test('.size is 1 after value is set', async () => {
		const k = new MapStore();

		expect(k.count).resolves.toBe(0);

		await k.set({
			test: 123,
		});

		expect(k.count()).resolves.toBe(1);
	});

	test('.size is updated after values are removed', async () => {
		const k = new MapStore([
			['red', serialise(140)],
			['blue', serialise(220)],
			['green', serialise(790)],
		]);

		expect(k.count()).resolves.toBe(3);

		await k.delete(['red', 'blue']);

		expect(k.count()).resolves.toBe(1);
	});
});

describe('.totalBytes()', () => {
	test('.totalBytes() is zero on initialisation', () => {
		const k = new MapStore();

		expect(k.totalBytes()).resolves.toBe(0);
	});

	test('.totalBytes() increases after value is set', async () => {
		const k = new MapStore();

		expect(k.totalBytes()).resolves.toBe(0);

		await k.set({
			test: 4657,
		});

		expect(k.totalBytes()).resolves.toBeGreaterThan(0);
	});

	test('.totalBytes() decreases after value is removed', async () => {
		const k = new MapStore([
			['test', serialise(4657)],
		]);

		const previousValue = await k.totalBytes();
		await k.delete('test');

		expect(k.totalBytes()).resolves.toBeLessThan(previousValue);
	});
});

describe('.sizeInBytes', () => {
	test('.sizeInBytes() is zero on initialisation', () => {
		const k = new MapStore();

		expect(k.sizeInBytes()).resolves.toBe(0);
	});

	test('.sizeInBytes() increases after value is set', async () => {
		const k = new MapStore();

		expect(k.sizeInBytes()).resolves.toMatchObject({});

		await k.set({
			test: 4657,
		});

		const result = await k.sizeInBytes();

		expect(result.keys).toContainEqual('test');
		expect(result.test).resolves.toBeGreaterThan(0);
	});

	test('.sizeInBytes() decreases after value is removed', async () => {
		const k = new MapStore([
			['test', serialise(4657)],
		]);

		await k.delete('test');

		const result = await k.sizeInBytes();

		expect(result.keys).not.toContainEqual('test');
	});
});
