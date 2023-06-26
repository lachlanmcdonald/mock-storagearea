/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import OnChangedEventTarget from '../OnChangedEventTarget';
import StorageArea from '../StorageArea';
import { Changes } from '../Types';

export default function notifyEventTargets(eventTargets: Set<OnChangedEventTarget>, changes: Changes, area: StorageArea) {
	for (const target of eventTargets) {
		const temp = {} as Record<string, {
			oldValue: any;
			newValue: any;
		}>;

		for (const key in changes.changes) {
			if (Object.hasOwn(changes.changes, key)) {
				const k = changes.changes[key];

				temp[key] = {
					oldValue: k.before.exists ? k.before.value : undefined, // eslint-disable-line no-undefined
					newValue: k.after.exists ? k.after.value : undefined, // eslint-disable-line no-undefined
				};
			}
		}

		target.dispatch(temp, area.__areaName);
	}
}
