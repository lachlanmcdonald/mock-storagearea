/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import OnChangedEvent from './OnChangedEvent';

/**
 * The __onChanged__ factory binds callbacks to the `onChanged` event on each
 * of the provide Storage Areas and passes through the `areaName` argument
 * to the callback.
 */
export default function onChanged(areas: Record<string, chrome.storage.StorageArea>) {
	const { dispatch, external } = OnChangedEvent();

	if (typeof areas !== 'object') {
		throw new TypeError(`onChanged() Argument 1 must be an object. Received: ${ typeof areas }`);
	}

	const keys = Object.getOwnPropertyNames(areas);

	if (keys.length === 0) {
		throw new TypeError(`onChanged() Argument 1 must have keys, received no keys.`);
	}

	for (const areaName in areas) {
		if (Object.hasOwn(areas, areaName)) {
			const area = areas[areaName];

			if (Object.hasOwn(area, 'onChanged')) {
				if (Object.hasOwn(area.onChanged, 'addListener')) {
					area.onChanged.addListener(changes => {
						dispatch(changes, areaName);
					});
				} else {
					throw new TypeError(`onChanged() Argument 1 property with key "${ areaName }" is missing addListener()`);
				}
			} else {
				throw new TypeError(`onChanged() Argument 1 property with key "${ areaName }" is missing "onChanged"`);
			}
		}
	}

	return external;
}
