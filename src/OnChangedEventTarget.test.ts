/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import OnChangedEventTarget from './OnChangedEventTarget';
import { OnChangedChanges, OnChangedListener } from './Types';

describe('OnChangedEventTarget()', () => {
	let eventTarget: OnChangedEventTarget;

	beforeEach(() => {
		eventTarget = new OnChangedEventTarget();
	});

	test('Listen for events with addListener()', done => {
		const inputChanges = {
			test: {
				oldValue: 1,
				newValue: 2,
			},
		} as OnChangedChanges;
		const inputAreaName = 'area';

		const handler: OnChangedListener = (changes, areaName) => {
			expect(changes).toMatchObject(inputChanges);
			expect(areaName).toBe(inputAreaName);
			done();
		};

		expect(() => {
			eventTarget.addListener(handler);

			eventTarget.dispatch(inputChanges, inputAreaName);
		}).not.toThrow();
	});

	test('Can remove a listener with removeListener()', () => {
		const handler: OnChangedListener = jest.fn();

		expect(() => {
			eventTarget.addListener(handler);

			eventTarget.dispatch({
				test: {
					oldValue: 1,
					newValue: 2,
				},
			}, 'area');

			eventTarget.removeListener(handler);

			eventTarget.dispatch({
				test: {
					oldValue: 2,
					newValue: 3,
				},
			}, 'area');

			expect(handler).not.toHaveBeenCalledTimes(2);
		}).not.toThrow();
	});
});
