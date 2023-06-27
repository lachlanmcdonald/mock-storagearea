/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import OnChangedEvent from './OnChangedEvent';
import { StorageAreaFactory } from './StorageAreaFactory';

type StorageAreaLike = ReturnType<typeof StorageAreaFactory>;

/**
 * The __onChanged__ factory binds callbacks to the `onChanged` event on each
 * of the provide _Storage Areas_ and passes through the `areaName` argument
 * to the callback.
 */
export default function onChanged(areas: Record<string, StorageAreaLike>) {
	const { dispatch, external } = OnChangedEvent();

	for (const areaName in areas) {
		if (Object.hasOwn(areas, areaName)) {
			const area = areas[areaName];

			if (Object.hasOwn(area, 'onChanged')) {
				if (Object.hasOwn(area.onChanged, 'addListener')) {
					area.onChanged.addListener(changes => {
						dispatch(changes, areaName);
					});
				} else {
					throw new TypeError(`onChanged() Argument 1 property with key "${areaName}" is missing addListener()`);
				}
			} else {
				throw new TypeError(`onChanged() Argument 1 property with key "${areaName}" is missing "onChanged"`);
			}
		}
	}

	return external;
}
