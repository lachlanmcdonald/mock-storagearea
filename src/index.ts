/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
export { CHROME_LOCAL_STORAGE_DEFAULT_QUOTA, CHROME_SYNC_STORAGE_DEFAULT_QUOTA, UNLIMITED_QUOTA } from './Constants';
export { default as LocalStorageArea } from './LocalStorageArea';
export { default as ManagedStorageArea } from './ManagedStorageArea';
export { default as SessionStorageArea } from './SessionStorageArea';
export { default as SyncStorageArea } from './SyncStorageArea';
export { default as StorageArea } from './StorageArea';
export { default as Store } from './Store';
export type { AccessLevel, Changes, DeserialiserFunction, OnChangedChanges, OnChangedListener, Payload, PropertyChanges, Quota, Quotas, SerialiserFunction } from './Types';
export { deserialise, onChangedFactory, serialise } from './utils';
