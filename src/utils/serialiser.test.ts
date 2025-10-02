/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import { deserialise } from './deserialise';
import { serialise } from './serialiser';

const UNCHANGED_PRIMITIVES = [
	['Empty String', ''],
	['String', 'abc'],
	['True', true],
	['False', false],
	['Number', 100],
] as Array<[string, any]>;

const OMITTED_OR_NULL = [
	['NaN', NaN],
	['Infinity', Infinity],
	['Negative Infinity', -Infinity],
	['Symbol', Symbol('Test')],
	['Undefined', undefined], // eslint-disable-line no-undefined
] as Array<[string, any]>;

const UNSERIALISABLE = [
	['Date', new Date(), '{}'],
	['RegExp', /abc/gui, '{}'],
	['Map', new Map(), '{}'],
	['Set', new Set(), '{}'],
] as Array<[string, any, string]>;

describe('serialise() and deserialise()', () => {
	describe('Returned unchanged', () => {
		test.each(UNCHANGED_PRIMITIVES)('%s', (_name, input) => {
			const k = serialise(input) as string;

			expect(deserialise(k)).toBe(input);
		});

		test('Null', () => {
			const k = serialise(null) as string;

			expect(deserialise(k)).toBeNull();
		});
	});

	describe('Return unchanged when in an array', () => {
		test.each(UNCHANGED_PRIMITIVES)('%s', (_name, input) => {
			const k = serialise([input]) as string;

			expect(deserialise(k)).toMatchObject([input]);
		});

		test('Null', () => {
			const k = serialise([null]) as string;

			expect(deserialise(k)).toMatchObject([null]);
		});
	});

	describe('Return unchanged when in an object', () => {
		test.each(UNCHANGED_PRIMITIVES)('%s', (_name, input) => {
			const k = serialise({ key: input }) as string;

			expect(deserialise(k)).toMatchObject({ key: input });
		});

		test('Null', () => {
			const k = serialise({ key: null }) as string;

			expect(deserialise(k)).toMatchObject({ key: null });
		});
	});

	describe('Throws a TypeError', () => {
		test.each([
			['BigInt', BigInt(1)],
			['TypedArray', new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0])],
			['ArrayBuffer', new ArrayBuffer(8)],
		])('%s', (_name, input) => {
			expect(() => {
				serialise(input);
			}).toThrow(TypeError);
		});
	});

	describe('Return null (to be omitted)', () => {
		test.each(OMITTED_OR_NULL)('%s', (_name, input) => {
			const k = serialise(input) as string;

			expect(deserialise(k)).toBeNull();
		});

		test('Functions', () => {
			const k = serialise(() => null);

			expect(k).toBeNull();
		});
	});

	describe('Return null when stored in an object (to be omitted)', () => {
		test('Functions', () => {
			const k = serialise({
				a: () => null,
				b() {
					return null;
				},
			}) as string;

			expect(deserialise(k)).toMatchObject({});
		});
	});

	describe('Become "null" when in an array', () => {
		test.each(OMITTED_OR_NULL)('%s', (_name, input) => {
			const k = serialise([input]) as string;

			expect(deserialise(k)).toMatchObject([null]);
		});

		test('Functions', () => {
			const k = serialise([() => null]) as string;

			expect(deserialise(k)).toMatchObject([null]);
		});
	});

	describe('Become "null" when an object property', () => {
		test.each(OMITTED_OR_NULL)('%s', (_name, input) => {
			const k = serialise({ key: input }) as string;

			expect(deserialise(k)).toMatchObject({ key: null });
		});
	});

	describe('Unserialisable', () => {
		test.each(UNSERIALISABLE)('%s', (_name, input, expected) => {
			const k = serialise(input) as string;

			expect(k).toBe(expected);
		});
	});

	describe('Edge-cases', () => {
		describe('Zero', () => {
			test.each([
				['Zero', 0],
				['Positive Zero', +0],
				['Negative Zero', -0],
			])('%s is returned without a sign', (_name, input) => {
				const k = serialise(input) as string;

				expect(k).toBe('0');
			});
		});
	});
});

describe('serialise()', () => {
	class TestClass {
		a: number;
		b: number | null;
		c: boolean;

		constructor() {
			this.a = 123;
			this.b = null;
			this.c = false;
		}

		get getterSetter() {
			return this.a;
		}

		set getterSetter(value: number) {
			this.a = value;
		}

		random() {
			this.a = Math.random();
		}
	}

	describe('Classes', () => {
		test('Class members are serialised are objects', () => {
			const k = serialise(new TestClass()) as string;

			expect(deserialise(k)).toMatchObject({
				a: 123,
				b: null,
				c: false,
			});
		});
	});

	describe('Objects', () => {
		test('Empty object properties are serialised', () => {
			const input = {};
			const k = serialise(input) as string;

			expect(deserialise(k)).toMatchObject(input);
		});

		test('Object properties are serialised', () => {
			const input = {
				a: 123,
				b: true,
				c: null,
				d: [1, 2, 3, 4],
			};
			const k = serialise(input) as string;

			expect(deserialise(k)).toMatchObject(input);
		});
	});

	describe('Arrays', () => {
		test('Empty arrays are serialised', () => {
			const input = [] as Array<unknown>;
			const k = serialise(input) as string;

			expect(deserialise(k)).toMatchObject(input);
		});

		test('Arrays are serialised', () => {
			const input = [
				123,
				true,
				null,
				[1, 2, 3, 4],
			];
			const k = serialise(input) as string;

			expect(deserialise(k)).toMatchObject(input);
		});
	});
});
