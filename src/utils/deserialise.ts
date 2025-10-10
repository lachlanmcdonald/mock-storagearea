/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */

import { DeserialiseFunction } from '../Types';

/**
 * Deserialises a value previously serialised with {@link serialise()}, that is, a
 * value which was serialised in accordance with the observed serialisation rules in Chrome.
 */
export const deserialise: DeserialiseFunction = (value: string) => {
	return JSON.parse(value);
};
