/*
* Copyright (c) 2023 Lachlan McDonald. All rights reserved.
* This file is licensed under the MIT License
* https://github.com/lachlanmcdonald/mock-storagearea
*/
export * from './Constants';
export { deserialise, serialise } from './utils/serialiser';
export { StorageAreaFactory, SyncStorageArea, LocalStorageArea, SessionStorageArea, ManagedStorageArea } from './StorageAreaFactory';
export { default as Store } from './Store';
