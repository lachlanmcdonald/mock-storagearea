/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */

/**
 * Deserialises a value previously serialised with {@link serialise()}, that is, a
 * value which was serialised in accordance with the observed serialisation rules in Chrome.
 */

export const deserialise = (value: string) => {
	return JSON.parse(value);
};

/**
 * Deserialises a value previously serialised by {@link SerialiseFunction}.
 */
export type DeserialiseFunction = typeof deserialise;
