/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import { OnChangedChanges, OnChangedListener } from './Types';

/**
 * __OnChangedEventTarget__ is an extension of __EventTarget__ which is is intended to provide
 * event management for `chrome.storage.onChanged` for both Node and browser contexts.
 */
export default class OnChangedEventTarget extends EventTarget {
	originalListeners: WeakMap<OnChangedListener, (event: Event) => void>;
	eventData: WeakMap<Event, { detail: any }>;

	constructor() {
		super();
		this.originalListeners = new WeakMap();
		this.eventData = new WeakMap();
	}

	/**
	 * Dispatches a new event which indicates a change of a storage area
	 * has occurred.
	 *
	 * __Note:__ As Node does not implement `CustomEvent`, then event data
	 * is stored within the `eventData` property on the class itself. Therefore
	 * the event does not contain any additional information, but can be used to
	 * look-up the data on `eventData`.
	 */
	dispatch(changes: OnChangedChanges, areaName: string) {
		const e = new Event('changed');

		this.eventData.set(e, {
			detail: {
				changes,
				areaName,
			},
		});

		this.dispatchEvent(e);
	}

	/**
	 * Implements the __addListener__ method that would be found on
	 * `chrome.storage.onChanged.addListener`.
	 */
	addListener(callback: OnChangedListener) {
		const handleEvent = (event: Event) => {
			const data = this.eventData.get(event);

			if (data && Object.hasOwn(data, 'detail')) {
				const {changes, areaName} = data.detail;

				callback(changes, areaName);
			}
		};

		this.originalListeners.set(callback, handleEvent);

		this.addEventListener('changed', handleEvent);
	}

	/**
	 * Implements the __removeListener__ method that would be found on
	 * `chrome.storage.onChanged.removeListener`.
	 */
	removeListener(callback: OnChangedListener) {
		if (this.originalListeners.has(callback)) {
			const handleEvent = this.originalListeners.get(callback);

			if (handleEvent) {
				this.removeEventListener('changed', handleEvent);
			}
		}
	}
}
