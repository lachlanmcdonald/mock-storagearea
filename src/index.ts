/*
* Copyright (c) 2024 Lachlan McDonald. All rights reserved.
* This file is licensed under the MIT License
* https://github.com/lachlanmcdonald/mock-storagearea
*/
export { default as createStorageArea } from './createStorageArea';

export { deserialise, DeserialiseFunction } from './utils/deserialise';
export { serialise, SerialiseFunction } from './utils/serialiser';
export { default as onChanged } from './onChanged';
export { createLocalStorageArea, createManagedStorageArea, createSessionStorageArea, createSyncStorageArea } from './StorageAreas';
export { default as Store } from './Store';

export * from './Constants';
