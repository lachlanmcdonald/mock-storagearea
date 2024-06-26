/* eslint-disable no-empty-function */
/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import { CHROME_LOCAL_STORAGE_DEFAULT_QUOTA, CHROME_SESSION_STORAGE_DEFAULT_QUOTA, CHROME_SYNC_STORAGE_DEFAULT_QUOTA, UNLIMITED_QUOTA } from './Constants';
import { createManagedStorageArea, createSessionStorageArea, createLocalStorageArea, createSyncStorageArea } from './StorageAreas';
import Store from './Store';
import { Quota } from './Types';
import { serialise, SerialiseFunction } from './utils/serialiser';
import { DeserialiseFunction } from './utils/deserialise';
import createStorageArea from './createStorageArea';

const SAMPLE = [
	['value0', serialise(8546)],
	['value1', serialise(4645)],
	['value2', serialise(8176)],
	['value3', serialise(7465)],
];

describe('createStorageArea()', () => {
	test('Store can be initialised with an existing payload', () => {
		createStorageArea(new Store([
			['value0', serialise(1234)],
			['value1', serialise(1234)],
			['value2', serialise(1234)],
			['value3', serialise(1234)],
		]));
	});

	test('Store can be initialised with quota overrides', () => {
		const k = createStorageArea(null, {
			MAX_ITEMS: 128,
		});

		expect(k.MAX_ITEMS).toBe(128);
	});

	test('Store can be initialised with a serialiser and deserialiser', () => {
		/** Serialise all values as a string of 10 characters. */
		const newSerialiser: SerialiseFunction = (value: any) => {
			return `<${ JSON.stringify(value) }>`;
		};

		/** Deserialise all values as the number 4. */
		const newDeserialiser: DeserialiseFunction = (value: string) => {
			return JSON.parse(value.slice(1, -1));
		};

		const k = createStorageArea(new Store([
			['contrast', newSerialiser(15)],
			['primitive', newSerialiser(99)],
			['travel', newSerialiser(13)],
			['bend', newSerialiser(28)],
		], newSerialiser, newDeserialiser));

		expect(k.get(['contrast', 'primitive', 'travel', 'bend'])).resolves.toMatchObject({
			contrast: 15,
			primitive: 99,
			travel: 13,
			bend: 28,
		});
	});

	test('Store is empty by default', () => {
		const k = createStorageArea();

		expect(k.getBytesInUse()).resolves.toBe(0);
	});

	describe('.getBytesInUse()', () => {
		test.each([
			['Returns zero when empty', [], null, 0],
			['Returns zero when key does not exist', [], 'a', 0],
			['Returns zero when keys do not exist', [], ['a', 'b'], 0],
			['Returns the correct size when storage contains values', SAMPLE, null, 40],
			['Returns zero when keys are an empty array', SAMPLE, [], 0],
		])('%s', (_message, initialStore, input, expected) => {
			const k = createStorageArea(new Store(initialStore));

			expect(k.getBytesInUse(input)).resolves.toBe(expected);
		});

		test.each([
			['Fails when first argument is an array with non-string key', [123]],
			['Fails when first argument is not a string', true],
		])('%s', (_message, input) => {
			const k = createStorageArea(new Store());

			expect(() => {
				// @ts-expect-error Expected type mis-match
				k.getBytesInUse(input);
			}).toThrow(TypeError);
		});
	});

	test('Returns a promise of the total size when arguments are not provided', () => {
		const k = createStorageArea(new Store(SAMPLE));

		expect(k.getBytesInUse()).resolves.toBe(40);
	});

	describe('setAccessLevel()', () => {
		test('Can set access level', () => {
			const area = createStorageArea();

			expect(area.setAccessLevel({
				accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
			})).resolves.not.toThrow();

			expect(area.setAccessLevel({
				accessLevel: 'TRUSTED_CONTEXTS',
			})).resolves.not.toThrow();
		});
	});

	describe('.clear()', () => {
		test('Removes all existing items', () => {
			const k = createStorageArea(new Store([
				['red', serialise(140)],
				['blue', serialise(220)],
				['green', serialise(790)],
			]));

			expect(k.getBytesInUse(null)).resolves.toBe(21);
			expect(k.clear()).resolves.not.toThrow();
			expect(k.getBytesInUse(null)).resolves.toBe(0);
		});

		test('Will reject with an error if MAX_WRITE_OPERATIONS_PER_HOUR is exceeded', () => {
			const k = createStorageArea(null, {
				MAX_WRITE_OPERATIONS_PER_HOUR: 2,
			});

			expect(k.clear()).resolves.not.toThrow();
			expect(k.clear()).resolves.not.toThrow();
			expect(k.clear()).rejects.toThrow(/quota exceeded.+MAX_WRITE_OPERATIONS_PER_HOUR/ui);
		});

		test('Will reject with an error if MAX_WRITE_OPERATIONS_PER_MINUTE is exceeded', () => {
			const k = createStorageArea(null, {
				MAX_WRITE_OPERATIONS_PER_MINUTE: 2,
			});

			expect(k.clear()).resolves.not.toThrow();
			expect(k.clear()).resolves.not.toThrow();
			expect(k.clear()).rejects.toThrow(/quota exceeded.+MAX_WRITE_OPERATIONS_PER_MINUTE/ui);
		});

		test('Rejects either MAX_WRITE_OPERATIONS_PER_HOUR or MAX_WRITE_OPERATIONS_PER_MINUTE', () => {
			const k = createStorageArea(null, {
				MAX_WRITE_OPERATIONS_PER_HOUR: 2,
				MAX_WRITE_OPERATIONS_PER_MINUTE: 2,
			});

			k.clear().then(() => {
				k.clear().then(() => {
					expect(k.clear()).rejects.toThrow(/quota exceeded.+(MAX_WRITE_OPERATIONS_PER_HOUR|MAX_WRITE_OPERATIONS_PER_MINUTE)/ui);
				});
			});
		});

		test('Failed operations due to an exceeded quota will not modify state', () => {
			const k = createStorageArea(new Store([
				['a', serialise('original')],
			]), {
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
			const k = createStorageArea(new Store([
				['test', serialise(123)],
			]));

			expect(k.get('test')).resolves.toMatchObject({
				test: 123,
			});
		});

		test('Only returns keys which exist', () => {
			const k = createStorageArea(new Store([
				['test', serialise(123)],
			]));

			expect(k.get(['test', 'missingKey', 'otherKey'])).resolves.toMatchObject({
				test: 123,
			});
		});

		test('Returns default values for missing keys', () => {
			const k = createStorageArea(new Store([
				['test', serialise(123)],
			]));

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
			const k = createStorageArea(new Store([
				['a', serialise(123)],
				['b', serialise(123)],
				['c', serialise(123)],
			]));

			expect(k.get(null)).resolves.toMatchObject({
				a: 123,
				b: 123,
				c: 123,
			});
		});

		test('Returns an empty object if store is empty and null is provided', () => {
			const k = createStorageArea();

			expect(k.get(null)).resolves.toMatchObject({});
		});

		test('Returns an empty object if no keys exist and no default values provided', () => {
			const k = createStorageArea();

			expect(k.get(['a', 'b', 'c'])).resolves.toMatchObject({});
		});

		/**
		 * In Chrome, the following command:
		 *
		 *     window.chrome.storage.local.set({
		 *         a: {
		 *             b: 123,
		 *             c: { d: 123 },
		 *         },
		 *     }, () => {
		 *         window.chrome.storage.local.get({
		 *             a: {
		 *                 c: {
		 *                     e: 4567,
		 *                     k: undefined,
		 *                 },
		 *             },
		 *         }, data => {
		 *             console.log(data);
		 *         });
		 *     });
		 *
		 * Will return:
		 *
		 *    {
		 *        "a": {
		 *            "b": 123,
		 *            "c": {
		 *                "d": 123,
		 *                "e": 4567
		 *            }
		 *        }
		 *    }
		 */
		test('Returns full objects when a default is provided on a nested object', () => {
			const k = createStorageArea(new Store([
				['a', serialise({
					b: 123,
					c: { d: 123 },
				})],
			]));

			expect(k.get({
				a: {
					z: 999,
					c: {
						e: 4567,
						k: undefined, // eslint-disable-line no-undefined
					},
				},
			})).resolves.toMatchObject({
				a: {
					b: 123,
					z: 999,
					c: {
						d: 123,
						e: 4567,
					},
				},
			});
		});
	});

	describe('.set()', () => {
		test('Can set an item', () => {
			const k = createStorageArea();

			expect(k.set({
				test: 'value',
			})).resolves.not.toThrow();
		});

		test('Will reject with an error if MAX_WRITE_OPERATIONS_PER_HOUR is exceeded', () => {
			const k = createStorageArea(null, {
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
			const k = createStorageArea(null, {
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

		test('Rejects either MAX_WRITE_OPERATIONS_PER_HOUR or MAX_WRITE_OPERATIONS_PER_MINUTE', () => {
			const k = createStorageArea(null, {
				MAX_WRITE_OPERATIONS_PER_HOUR: 2,
				MAX_WRITE_OPERATIONS_PER_MINUTE: 2,
			});

			k.set({
				a: 1,
			}).then(() => {
				k.set({
					b: 2,
				}).then(() => {
					expect(k.set({
						c: 3,
					})).rejects.toThrow(/quota exceeded.+(MAX_WRITE_OPERATIONS_PER_HOUR|MAX_WRITE_OPERATIONS_PER_MINUTE)/ui);
				});
			});
		});

		test('Will reject with an error if MAX_ITEMS is exceeded', () => {
			const k = createStorageArea(null, {
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
			const k = createStorageArea(null, {
				QUOTA_BYTES: 64,
			});

			expect(k.set({
				/* spell-checker: disable */
				a: 'Sint exercitation.',
				b: 'Excepteur mollit fugiat reprehenderit ex elit quis id consectetur pariatur nisi.',
				c: 'Enim veniam sunt sint officia.',
				d: 'Nulla tempor.',
				e: 'Cillum sunt cupidatat.',
				f: 'Tempor sunt nisi proident ex mollit commodo ad esse do.',
				/* spell-checker: enable */
			})).rejects.toThrow(/quota exceeded.+QUOTA_BYTES/ui);
		});

		test('Will reject with an error if QUOTA_BYTES_PER_ITEM is exceeded', () => {
			const k = createStorageArea(null, {
				QUOTA_BYTES_PER_ITEM: 32,
			});

			expect(k.set({
				/* spell-checker: disable */
				a: 'Excepteur mollit fugiat reprehenderit ex elit quis id consectetur pariatur nisi.',
				/* spell-checker: enable */
			})).rejects.toThrow(/quota exceeded.+QUOTA_BYTES_PER_ITEM/ui);
		});

		test('Failed operations due to an exceeded quota will not modify state', () => {
			const k = createStorageArea(new Store([
				['a', serialise('original')],
			]), {
				QUOTA_BYTES_PER_ITEM: 32,
			});

			expect(k.set({
				/* spell-checker: disable */
				a: 'Excepteur mollit fugiat reprehenderit ex elit quis id consectetur pariatur nisi.',
				/* spell-checker: enable */
			})).rejects.toThrow(/quota exceeded.+QUOTA_BYTES_PER_ITEM/ui);

			expect(k.get('a')).resolves.toMatchObject({
				a: 'original',
			});
		});
	});

	describe('.remove()', () => {
		test('Can remove a key', () => {
			const k = createStorageArea(new Store([
				['value0', serialise(1234)],
				['value1', serialise(1234)],
				['value2', serialise(1234)],
				['value3', serialise(1234)],
			]));

			expect(k.remove('value0')).resolves.not.toThrow();
		});

		test('Can remove keys', () => {
			const k = createStorageArea(new Store([
				['value0', serialise(1234)],
				['value1', serialise(1234)],
				['value2', serialise(1234)],
				['value3', serialise(1234)],
			]));

			expect(k.remove(['value0', 'value1'])).resolves.not.toThrow();
		});

		test('Removing a non-existant key is not an error', () => {
			const k = createStorageArea();

			expect(k.remove('key')).resolves.not.toThrow();
		});

		test('Removing non-existant keys is not an error', () => {
			const k = createStorageArea();

			expect(k.remove(['key1', 'key2'])).resolves.not.toThrow();
		});

		test('Will reject with an error if MAX_WRITE_OPERATIONS_PER_HOUR is exceeded', () => {
			const k = createStorageArea(null, {
				MAX_WRITE_OPERATIONS_PER_HOUR: 2,
			});

			k.remove('key').then(() => {
				k.remove('key').then(() => {
					expect(k.remove('key')).rejects.toThrow(/quota exceeded.+MAX_WRITE_OPERATIONS_PER_HOUR/ui);
				});
			});
		});

		test('Will reject with an error if MAX_WRITE_OPERATIONS_PER_MINUTE is exceeded', () => {
			const k = createStorageArea(null, {
				MAX_WRITE_OPERATIONS_PER_MINUTE: 2,
			});

			k.remove('key').then(() => {
				k.remove('key').then(() => {
					expect(k.remove('key')).rejects.toThrow(/quota exceeded.+MAX_WRITE_OPERATIONS_PER_MINUTE/ui);
				});
			});
		});

		test('Rejects either MAX_WRITE_OPERATIONS_PER_HOUR or MAX_WRITE_OPERATIONS_PER_MINUTE', () => {
			const k = createStorageArea(null, {
				MAX_WRITE_OPERATIONS_PER_HOUR: 2,
				MAX_WRITE_OPERATIONS_PER_MINUTE: 2,
			});

			k.remove('key').then(() => {
				k.remove('key').then(() => {
					expect(k.remove('key')).rejects.toThrow(/quota exceeded.+(MAX_WRITE_OPERATIONS_PER_HOUR|MAX_WRITE_OPERATIONS_PER_MINUTE)/ui);
				});
			});
		});

		test('Failed operations due to an exceeded quota will not modify state', () => {
			const k = createStorageArea(new Store([
				['a', serialise('original')],
			]), {
				MAX_WRITE_OPERATIONS_PER_HOUR: 2,
			});

			k.remove('key').then(() => {
				k.remove('key').then(() => {
					k.remove('key').then(() => {
						throw new Error('This branch should not be reached');
					}).catch(e => {
						expect(e).toBeInstanceOf(Error);
						expect(e.message).toMatch(/quota exceeded.+MAX_WRITE_OPERATIONS_PER_HOUR/ui);

						expect(k.get('a')).resolves.toMatchObject({
							a: 'original',
						});
					});
				});
			});
		});
	});
});

describe('createStorageArea()', () => {
	describe('Callbacks', () => {
		test('.get() is unsupported', () => {
			const k = createStorageArea();

			expect(() => {
				k.get(null, () => {});
			}).toThrow(/unsupported/i);
		});

		test('.remove() is unsupported', () => {
			const k = createStorageArea();

			expect(() => {
				k.remove('a', () => {});
			}).toThrow(/unsupported/i);
		});

		test('.set() is unsupported', () => {
			const k = createStorageArea();

			expect(() => {
				k.set({
					a: 12,
				}, () => {});
			}).toThrow(/unsupported/i);
		});

		test('.clear() is unsupported', () => {
			const k = createStorageArea();

			expect(() => {
				k.clear(() => {});
			}).toThrow(/unsupported/i);
		});

		test('.getBytesInUse() is unsupported', () => {
			const k = createStorageArea();

			expect(() => {
				k.getBytesInUse(() => {});
			}).toThrow(/unsupported/i);
		});

		test('.setAccessLevel() is unsupported', () => {
			const k = createStorageArea();

			expect(() => {
				k.setAccessLevel({
					accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
				}, () => {});
			}).toThrow(/unsupported/i);
		});
	});
});

describe.each([
	['LocalStorageArea', createLocalStorageArea, CHROME_LOCAL_STORAGE_DEFAULT_QUOTA],
	['SessionStorageArea', createSessionStorageArea, CHROME_SESSION_STORAGE_DEFAULT_QUOTA],
	['SyncStorageArea', createSyncStorageArea, CHROME_SYNC_STORAGE_DEFAULT_QUOTA],
])('%s', (_name, factoryFunction, defaultQuotas) => {
	const expectUndefined : Array<[keyof Quota]> = [];
	const expectDefined : Array<[keyof Quota, number]> = [];

	for (const key of Object.keys(UNLIMITED_QUOTA) as Array<keyof Quota>) {
		if (Object.hasOwn(defaultQuotas, key) && defaultQuotas[key as keyof typeof defaultQuotas] !== Infinity) {
			expectDefined.push([
				key,
				defaultQuotas[key as keyof typeof defaultQuotas] as number,
			]);
		} else {
			expectUndefined.push([key]);
		}
	}

	if (expectUndefined.length) {
		test.each(expectUndefined)('%s to be undefined', (property) => {
			const k = factoryFunction();

			// @ts-expect-error For test purposes
			expect(k[property]).toBeUndefined();
		});
	}

	if (expectDefined.length) {
		test.each(expectDefined)('%s defaults to %p', (property, value) => {
			const k = factoryFunction();

			// @ts-expect-error For test purposes
			expect(k[property]).toBe(value);
		});
	}
});

describe('ManagedStorageArea', () => {
	test('Calling set() throws an error', () => {
		const k = createManagedStorageArea();

		expect(k.set({
			test: 123,
		})).rejects.toThrow(/cannot mutate/ui);
	});

	test('Calling remove() throws an error', () => {
		const k = createManagedStorageArea();

		expect(k.remove('test')).rejects.toThrow(/cannot mutate/ui);
	});

	test('Calling clear() throws an error', () => {
		const k = createManagedStorageArea();

		expect(k.clear()).rejects.toThrow(/cannot mutate/ui);
	});
});
