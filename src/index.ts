/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
export { CHROME_LOCAL_STORAGE_DEFAULT_QUOTA, CHROME_SYNC_STORAGE_DEFAULT_QUOTA, UNLIMITED_QUOTA } from './Constants';
export { default as LocalStorageArea } from './areas/LocalStorageArea';
export { default as ManagedStorageArea } from './areas/ManagedStorageArea';
export { default as SessionStorageArea } from './areas/SessionStorageArea';
export { default as SyncStorageArea } from './areas/SyncStorageArea';
export { default as StorageArea } from './StorageArea';
export { default as Store } from './Store';
export type { AccessLevel, Changes, DeserialiserFunction, OnChangedChanges, OnChangedListener, Payload, PropertyChanges, Quota, Quotas, SerialiserFunction } from './Types';
export { default as onChangedFactory } from './utils/onChangedFactory';
export { deserialise, serialise } from './utils/serialiser';
