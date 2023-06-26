/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import Store from '../Store';
import { Changes } from '../Types';

export default function StoreChangeFactory(before: Store, after: Store) {
	return {
		before,
		after,
		changes: before.compare(after),
	} as Changes;
}
