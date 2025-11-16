/* eslint-disable func-style */
/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import { StorageChangeCallback } from './Types';

const EVENT_NAME = 'changed';

export default function OnChangedEvent<H extends StorageChangeCallback>() {
	const callbackRegistration = new Map() as Map<H, (event: Event) => void>;
	const eventTarget = new EventTarget();

	/**
	 * Registers an event listener callback to an event.
	 */
	function addListener(callback: H) {
		const handler = (event: Event) => {
			if (event instanceof CustomEvent) {
				const { changes, areaName } = event.detail;
				callback(changes, areaName);
			}
		};

		eventTarget.addEventListener(EVENT_NAME, handler);
		callbackRegistration.set(callback, handler);
	}

	/**
	 * Removes an event listener callback on an event.
	 */
	function removeListener(callback: H) {
		if (callbackRegistration.has(callback)) {
			const handler = callbackRegistration.get(callback)!;

			eventTarget.removeEventListener(EVENT_NAME, handler);
			callbackRegistration.delete(callback);
		}
	}

	/**
	 * Return if the event listener callback is registered on an event.
	 */
	function hasListener(callback: H) {
		return callbackRegistration.has(callback);
	}

	/**
	 * Return if any event listener callbacks are registered on an event.
	 */
	function hasListeners() {
		return callbackRegistration.size > 0;
	}

	/**
	 * Dispatches a new event which indicates a change has occurred within a Storage Area.
	 */
	function dispatch(changes: Record<string, chrome.storage.StorageChange>, areaName?: string) {
		const event = new CustomEvent(EVENT_NAME, {
			detail: {
				changes,
				areaName,
			},
		});

		eventTarget.dispatchEvent(event);
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
