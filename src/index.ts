/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
export { default as createStorageArea, inspect } from './createStorageArea';
export { default as MapStore } from './MapStore';
export { default as onChanged } from './onChanged';
export { createLocalStorageArea, createManagedStorageArea, createSessionStorageArea, createSyncStorageArea } from './StorageAreas';
export { deserialise } from './utils/deserialise';
export { serialise } from './utils/serialiser';

export * from './Constants';
export * from './Types';

