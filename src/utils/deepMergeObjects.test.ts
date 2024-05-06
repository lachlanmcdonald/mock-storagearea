/* eslint-disable no-undefined */
/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import deepMergeObjects from './deepMergeObjects';

test('Merges over empty base', () => {
	const baseObject = {};

	const result = deepMergeObjects(baseObject, {
		a: 123,
		c: { x: 123 },
	});

	expect(result).toMatchObject({
		a: 123,
		c: { x: 123 },
	});
});

test('Merges over base, updating values', () => {
	const baseObject = {
		c: { x: 0 },
	};

	const result = deepMergeObjects(baseObject, {
		a: 123,
		c: { x: 123 },
	});

	expect(result).toMatchObject({
		a: 123,
		c: { x: 123 },
	});
});

test('Merges over base, ignored nested values', () => {
	const baseObject = {
		c: { x: 0 },
	};

	const result = deepMergeObjects(baseObject, {
		a: 123,
		c: { k: 123 },
	});

	expect(result).toMatchObject({
		a: 123,
		c: { x: 0, k: 123 },
	});
});

test('Merges over base, ignored deeply-nested values', () => {
	const baseObject = {
		a: {
			b: {
				c: {
					d: {
						e: {
							f: 123,
						},
					},
				},
			},
		},
	};

	const result = deepMergeObjects(baseObject, {
		a: {
			b: {
				c: {
					d: {
						e: {
							z: 123,
						},
					},
				},
			},
		},
	});

	expect(result).toMatchObject({
		a: {
			b: {
				c: {
					d: {
						e: {
							f: 123,
							z: 123,
						},
					},
				},
			},
		},
	});
});

test('Merges over base, replacing primitives', () => {
	const baseObject = {
		c: { x: 0 },
	};

	const result = deepMergeObjects(baseObject, {
		c: {
			x: {
				a: 123,
			},
		},
	});

	expect(result).toMatchObject({
		c: {
			x: {
				a: 123,
			},
		},
	});
});

test('Replaces null', () => {
	const baseObject = {
		c: null,
	};

	const result = deepMergeObjects(baseObject, {
		c: 123,
	});

	expect(result).toMatchObject({
		c: 123,
	});
});

test('Replaces arrays', () => {
	const baseObject = {
		c: [1, 2, 3],
	};

	const result = deepMergeObjects(baseObject, {
		c: 123,
	});

	expect(result).toMatchObject({
		c: 123,
	});
});

test('Ignores undefined on over object', () => {
	const baseObject = {
		c: 100,
	};

	const result = deepMergeObjects(baseObject, {
		c: undefined,
	});

	expect(result).toMatchObject({
		c: 100,
	});
});

test('Ignores undefined on base object', () => {
	const baseObject = {
		c: undefined,
	};

	const result = deepMergeObjects(baseObject, {
		c: 100,
	});

	expect(result).toMatchObject({
		c: 100,
	});
});
