/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import OnChangedEvent from './OnChangedEvent';
import { OnChangedChanges, OnChangedListener } from './Types';

describe('OnChangedEvent()', () => {
	let onChanged: ReturnType<typeof OnChangedEvent>['external'];
	let dispatch: ReturnType<typeof OnChangedEvent>['dispatch'];

	beforeEach(() => {
		const k = OnChangedEvent();

		onChanged = k.external;
		dispatch = k.dispatch;
	});

	test('Listen for events with addListener()', done => {
		const inputChanges = {
			test: {
				oldValue: 1,
				newValue: 2,
			},
		} as OnChangedChanges;

		const handler: OnChangedListener = changes => {
			expect(changes).toMatchObject(inputChanges);
			done();
		};

		expect(() => {
			onChanged.addListener(handler);

			dispatch(inputChanges);
		}).not.toThrow();
	});

	test('Can remove a listener with removeListener()', () => {
		const handler: OnChangedListener = jest.fn();

		expect(() => {
			onChanged.addListener(handler);

			dispatch({
				test: {
					oldValue: 1,
					newValue: 2,
				},
			});

			onChanged.removeListener(handler);

			dispatch({
				test: {
					oldValue: 2,
					newValue: 3,
				},
			});

			expect(handler).not.toHaveBeenCalledTimes(2);
		}).not.toThrow();
	});
});
