import { UNLIMITED_QUOTA } from './Constants';
import StorageArea from './StorageArea';
import { AccessLevel, DeserialiserFunction, SerialiserFunction } from './Types';
import { serialise } from './utils';

describe('constructor()', () => {
	test('Store is empty by default', () => {
		const k = new StorageArea();

		expect(k.getBytesInUse(null)).resolves.toBe(0);
	});

	test('Store can be initialised with an existing payload', () => {
		const k = new StorageArea([
			['value0', serialise(1234)],
			['value1', serialise(1234)],
			['value2', serialise(1234)],
			['value3', serialise(1234)],
		]);

		expect(k.getBytesInUse(null)).resolves.toBe(40);
	});

	test('Store can be initialised with quota overrides', () => {
		const k = new StorageArea([], {
			MAX_ITEMS: 128,
		});

		expect(k.__quotas.MAX_ITEMS).toBe(128);
	});

	test('Store can be initialised with a serialiser and deserialiser', () => {
		/** Serialise all values as a string of 10 characters. */
		const newSerialiser: SerialiserFunction = () => {
			return '0123456789';
		};

		/** Deserialise all values as the number 4. */
		const newDeserialiser: DeserialiserFunction = () => {
			return 4;
		};

		const k = new StorageArea([
			['value0', newSerialiser(1234)],
			['value1', newSerialiser(1234)],
			['value2', newSerialiser(1234)],
			['value3', newSerialiser(1234)],
		], {}, newSerialiser, newDeserialiser);

		expect(k.getBytesInUse(null)).resolves.toBe(64);

		expect(k.get(['value0', 'value1', 'value2', 'value3'])).resolves.toMatchObject({
			value0: 4,
			value1: 4,
			value2: 4,
			value3: 4,
		});
	});
});

describe('.getBytesInUse()', () => {
	test('Returns zero when empty', () => {
		const k = new StorageArea();

		expect(k.getBytesInUse(null)).resolves.toBe(0);
	});

	test('Returns zero when key does not exist', () => {
		const k = new StorageArea();

		expect(k.getBytesInUse('key')).resolves.toBe(0);
	});

	test('Returns zero when keys do not exist', () => {
		const k = new StorageArea();

		expect(k.getBytesInUse(['key1', 'key2'])).resolves.toBe(0);
	});

	test('Returns the correct size when storage contains values', () => {
		const k = new StorageArea([
			['value0', serialise(1234)],
			['value1', serialise(1234)],
			['value2', serialise(1234)],
			['value3', serialise(1234)],
		]);

		expect(k.getBytesInUse(null)).resolves.toBe(40);
	});

	test('Fails when argument is not provided', () => {
		const k = new StorageArea();

		// @ts-expect-error Testing purposes
		expect(k.getBytesInUse()).rejects.toThrow(TypeError);
	});

	test('Fails when argument is an array with a string key', () => {
		const k = new StorageArea();

		// @ts-expect-error Testing purposes
		expect(k.getBytesInUse([123])).rejects.toThrow(TypeError);
	});

	test('Fails when argument has not a string key', () => {
		const k = new StorageArea();

		// @ts-expect-error Testing purposes
		expect(k.getBytesInUse(true)).rejects.toThrow(TypeError);
	});
});

describe('.clear()', () => {
	test('Removes all existing items', () => {
		const k = new StorageArea([
			['red', serialise(140)],
			['blue', serialise(220)],
			['green', serialise(790)],
		]);

		expect(k.getBytesInUse(null)).resolves.toBe(21);
		expect(k.clear()).resolves.not.toThrow();
		expect(k.getBytesInUse(null)).resolves.toBe(0);
	});

	test('Will reject with an error if MAX_WRITE_OPERATIONS_PER_HOUR is exceeded', () => {
		const k = new StorageArea([], {
			MAX_WRITE_OPERATIONS_PER_HOUR: 2,
		});

		expect(k.clear()).resolves.not.toThrow();
		expect(k.clear()).resolves.not.toThrow();
		expect(k.clear()).rejects.toThrow(/quota exceeded.+MAX_WRITE_OPERATIONS_PER_HOUR/ui);
	});

	test('Will reject with an error if MAX_WRITE_OPERATIONS_PER_MINUTE is exceeded', () => {
		const k = new StorageArea([], {
			MAX_WRITE_OPERATIONS_PER_MINUTE: 2,
		});

		expect(k.clear()).resolves.not.toThrow();
		expect(k.clear()).resolves.not.toThrow();
		expect(k.clear()).rejects.toThrow(/quota exceeded.+MAX_WRITE_OPERATIONS_PER_MINUTE/ui);
	});

	test('Rejects MAX_WRITE_OPERATIONS_PER_HOUR before MAX_WRITE_OPERATIONS_PER_MINUTE', () => {
		const k = new StorageArea([], {
			MAX_WRITE_OPERATIONS_PER_HOUR: 2,
			MAX_WRITE_OPERATIONS_PER_MINUTE: 2,
		});

		expect(k.clear()).resolves.not.toThrow();
		expect(k.clear()).resolves.not.toThrow();
		expect(k.clear()).rejects.toThrow(/quota exceeded.+MAX_WRITE_OPERATIONS_PER_HOUR/ui);
	});

	test('Failed operations due to an exceeded quota will not modify state', () => {
		const k = new StorageArea([
			['a', serialise('original')],
		], {
			MAX_WRITE_OPERATIONS_PER_HOUR: 2,
		});

		expect(k.set({ b: 123 })).resolves.not.toThrow();
		expect(k.set({ c: 123 })).resolves.not.toThrow();
		expect(k.clear()).rejects.toThrow(/quota exceeded.+MAX_WRITE_OPERATIONS_PER_HOUR/ui);

		expect(k.get(['a', 'b', 'c'])).resolves.toMatchObject({
			a: 'original',
			b: 123,
			c: 123,
		});
	});
});

describe('.get()', () => {
	test('Returns a value when it exists', () => {
		const k = new StorageArea([
			['test', serialise(123)],
		]);

		expect(k.get('test')).resolves.toMatchObject({
			test: 123,
		});
	});

	test('Only returns keys which exist', () => {
		const k = new StorageArea([
			['test', serialise(123)],
		]);

		expect(k.get(['test', 'missingKey', 'otherKey'])).resolves.toMatchObject({
			test: 123,
		});
	});

	test('Returns default values for missing keys', () => {
		const k = new StorageArea([
			['test', serialise(123)],
		]);

		expect(k.get({
			test: null,
			missingKey: null,
			otherKey: null,
		})).resolves.toMatchObject({
			test: 123,
			missingKey: null,
			otherKey: null,
		});
	});

	test('Returns all keys if null is provided', () => {
		const k = new StorageArea([
			['a', serialise(123)],
			['b', serialise(123)],
			['c', serialise(123)],
		]);

		expect(k.get(null)).resolves.toMatchObject({
			a: 123,
			b: 123,
			c: 123,
		});
	});

	test('Returns an empty object if store is empty and null is provided', () => {
		const k = new StorageArea();

		expect(k.get(null)).resolves.toMatchObject({});
	});

	test('Returns an empty object if no keys exist and no default values provided', () => {
		const k = new StorageArea();

		expect(k.get(['a', 'b', 'c'])).resolves.toMatchObject({});
	});
});

describe('.set()', () => {
	test('Can set an item', () => {
		const k = new StorageArea();

		expect(k.set({
			test: 'value',
		})).resolves.not.toThrow();
	});

	test('Will reject with an error if MAX_WRITE_OPERATIONS_PER_HOUR is exceeded', () => {
		const k = new StorageArea([], {
			MAX_WRITE_OPERATIONS_PER_HOUR: 2,
		});

		expect(k.set({
			a: 1,
		})).resolves.not.toThrow();

		expect(k.set({
			b: 2,
		})).resolves.not.toThrow();

		expect(k.set({
			a: 3,
			b: 3,
			c: 3,
		})).rejects.toThrow(/quota exceeded.+MAX_WRITE_OPERATIONS_PER_HOUR/ui);
	});

	test('Will reject with an error if MAX_WRITE_OPERATIONS_PER_MINUTE is exceeded', () => {
		const k = new StorageArea([], {
			MAX_WRITE_OPERATIONS_PER_MINUTE: 2,
		});

		expect(k.set({
			a: 1,
		})).resolves.not.toThrow();

		expect(k.set({
			b: 2,
		})).resolves.not.toThrow();

		expect(k.set({
			a: 3,
			b: 3,
			c: 3,
		})).rejects.toThrow(/quota exceeded.+MAX_WRITE_OPERATIONS_PER_MINUTE/ui);
	});

	test('Rejects MAX_WRITE_OPERATIONS_PER_HOUR before MAX_WRITE_OPERATIONS_PER_MINUTE', () => {
		const k = new StorageArea([], {
			MAX_WRITE_OPERATIONS_PER_HOUR: 2,
			MAX_WRITE_OPERATIONS_PER_MINUTE: 2,
		});

		expect(k.set({
			a: 1,
		})).resolves.not.toThrow();

		expect(k.set({
			b: 2,
		})).resolves.not.toThrow();

		expect(k.set({
			a: 3,
			b: 3,
			c: 3,
		})).rejects.toThrow(/quota exceeded.+MAX_WRITE_OPERATIONS_PER_HOUR/ui);
	});

	test('Will reject with an error if MAX_ITEMS is exceeded', () => {
		const k = new StorageArea([], {
			MAX_ITEMS: 3,
		});

		expect(k.set({
			a: 1,
			b: 1,
			c: 1,
			d: 1,
			e: 1,
			f: 1,
		})).rejects.toThrow(/quota exceeded.+MAX_ITEMS/ui);
	});

	test('Will reject with an error if QUOTA_BYTES is exceeded', () => {
		const k = new StorageArea([], {
			QUOTA_BYTES: 64,
		});

		expect(k.set({
			a: 'Sint exercitation.',
			b: 'Excepteur mollit fugiat reprehenderit ex elit quis id consectetur pariatur nisi.',
			c: 'Enim veniam sunt sint officia.',
			d: 'Nulla tempor.',
			e: 'Cillum sunt cupidatat.',
			f: 'Tempor sunt nisi proident ex mollit commodo ad esse do.',
		})).rejects.toThrow(/quota exceeded.+QUOTA_BYTES/ui);
	});

	test('Will reject with an error if QUOTA_BYTES_PER_ITEM is exceeded', () => {
		const k = new StorageArea([], {
			QUOTA_BYTES_PER_ITEM: 32,
		});

		expect(k.set({
			a: 'Excepteur mollit fugiat reprehenderit ex elit quis id consectetur pariatur nisi.',
		})).rejects.toThrow(/quota exceeded.+QUOTA_BYTES_PER_ITEM/ui);
	});

	test('Failed operations due to an exceeded quota will not modify state', () => {
		const k = new StorageArea([
			['a', serialise('original')],
		], {
			QUOTA_BYTES_PER_ITEM: 32,
		});

		expect(k.set({
			a: 'Excepteur mollit fugiat reprehenderit ex elit quis id consectetur pariatur nisi.',
		})).rejects.toThrow(/quota exceeded.+QUOTA_BYTES_PER_ITEM/ui);

		expect(k.get('a')).resolves.toMatchObject({
			a: 'original',
		});
	});
});

describe('.remove()', () => {
	test('Can remove a key', () => {
		const k = new StorageArea([
			['value0', serialise(1234)],
			['value1', serialise(1234)],
			['value2', serialise(1234)],
			['value3', serialise(1234)],
		]);

		expect(k.remove('value0')).resolves.not.toThrow();
	});

	test('Can remove keys', () => {
		const k = new StorageArea([
			['value0', serialise(1234)],
			['value1', serialise(1234)],
			['value2', serialise(1234)],
			['value3', serialise(1234)],
		]);

		expect(k.remove(['value0', 'value1'])).resolves.not.toThrow();
	});

	test('Can remove a non-existant key', () => {
		const k = new StorageArea();

		expect(k.remove('key')).resolves.not.toThrow();
	});

	test('Can remove non-existant keys', () => {
		const k = new StorageArea();

		expect(k.remove(['key1', 'key2'])).resolves.not.toThrow();
	});

	test('Will reject with an error if MAX_WRITE_OPERATIONS_PER_HOUR is exceeded', () => {
		const k = new StorageArea([], {
			MAX_WRITE_OPERATIONS_PER_HOUR: 2,
		});

		expect(k.remove('key')).resolves.not.toThrow();
		expect(k.remove('key')).resolves.not.toThrow();
		expect(k.remove('key')).rejects.toThrow(/quota exceeded.+MAX_WRITE_OPERATIONS_PER_HOUR/ui);
	});

	test('Will reject with an error if MAX_WRITE_OPERATIONS_PER_MINUTE is exceeded', () => {
		const k = new StorageArea([], {
			MAX_WRITE_OPERATIONS_PER_MINUTE: 2,
		});

		expect(k.remove('key')).resolves.not.toThrow();
		expect(k.remove('key')).resolves.not.toThrow();
		expect(k.remove('key')).rejects.toThrow(/quota exceeded.+MAX_WRITE_OPERATIONS_PER_MINUTE/ui);
	});

	test('Rejects MAX_WRITE_OPERATIONS_PER_HOUR before MAX_WRITE_OPERATIONS_PER_MINUTE', () => {
		const k = new StorageArea([], {
			MAX_WRITE_OPERATIONS_PER_HOUR: 2,
			MAX_WRITE_OPERATIONS_PER_MINUTE: 2,
		});

		expect(k.remove('key')).resolves.not.toThrow();
		expect(k.remove('key')).resolves.not.toThrow();
		expect(k.remove('key')).rejects.toThrow(/quota exceeded.+MAX_WRITE_OPERATIONS_PER_HOUR/ui);
	});

	test('Failed operations due to an exceeded quota will not modify state', () => {
		const k = new StorageArea([
			['a', serialise('original')],
		], {
			MAX_WRITE_OPERATIONS_PER_HOUR: 2,
		});

		expect(k.remove('key')).resolves.not.toThrow();
		expect(k.remove('key')).resolves.not.toThrow();
		expect(k.remove('key')).rejects.toThrow(/quota exceeded.+MAX_WRITE_OPERATIONS_PER_HOUR/ui);

		expect(k.get('a')).resolves.toMatchObject({
			a: 'original',
		});
	});
});

describe('.__unsafeInternalStore', () => {
	test('Can access __unsafeInternalStore property', () => {
		const k = new StorageArea();

		expect(k).toHaveProperty('__unsafeInternalStore');
	});
});

describe('.__quotas', () => {
	test('Can access __quotas property', () => {
		const k = new StorageArea();

		expect(k).toHaveProperty('__quotas');

		expect(k.__quotas).toMatchObject({
			...UNLIMITED_QUOTA,
			writeOperationsPerHour: {},
			writeOperationsPerMinute: {},
		});
	});
});

describe('.__eventTargets', () => {
	test('Can access __eventTargets property', () => {
		const k = new StorageArea();

		expect(k).toHaveProperty('__eventTargets');
	});
});

describe('setAccessLevel()', () => {
	test('Can set access level', () => {
		const k = new StorageArea();

		k.setAccessLevel(AccessLevel.TRUSTED_AND_UNTRUSTED_CONTEXTS);
		k.setAccessLevel(AccessLevel.TRUSTED_CONTEXTS);
	});
});
