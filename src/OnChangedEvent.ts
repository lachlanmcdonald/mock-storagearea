/* eslint-disable func-style */
/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import { StorageChanges } from './Types';

const EVENT_NAME = 'changed';

export default function OnChangedEvent<H extends(...args: any) => void>() {
	const registered = new Map() as Map<H, (event: Event) => void>;
	const eventTarget = new EventTarget();

	/**
	 * As Node does not support `CustomEvent`, and extending an `Event` will cause
	 * issues with TypeScript and `EventTarget`, the data is just stored and retrieved separately.
	 */
	const eventData = new WeakMap() as WeakMap<Event, any>;

	/**
	 * Registers an event listener callback to an event.
	 */
	function addListener(callback: H) {
		const handleEvent = (event: Event) => {
			if (eventData.has(event)) {
				callback(eventData.get(event));
			}
		};

		registered.set(callback, handleEvent);
		eventTarget.addEventListener(EVENT_NAME, handleEvent);
	}

	/**
	 * Removes an event listener callback on an event.
	 */
	function removeListener(callback: H) {
		const k = registered.has(callback);

		if (k) {
			eventTarget.removeEventListener(EVENT_NAME, registered.get(callback) as H);
			registered.delete(callback);
		}
	}

	/**
	 * Return if the event listener callback is registered on an event.
	 */
	function hasListener(callback: H) {
		return registered.has(callback);
	}

	/**
	 * Return if any event listener callbacks are registered on an event.
	 */
	function hasListeners() {
		return registered.size > 0;
	}

	/**
	 * Dispatches a new event which indicates a change has occurred within
	 * a _Storage Area_.
	 */
	function dispatch(changes: StorageChanges) {
		const e = new Event(EVENT_NAME);

		eventData.set(e, changes);
		eventTarget.dispatchEvent(e);
	}

	return {
		dispatch,
		/**
		 * Public methods which should be exposed as the `onChanged` property.
		 */
		external: {
			addListener,
			removeListener,
			hasListener,
			hasListeners,
		},
	};
}
