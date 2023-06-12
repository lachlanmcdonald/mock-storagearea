export { CHROME_LOCAL_STORAGE_DEFAULT_QUOTA, CHROME_SYNC_STORAGE_DEFAULT_QUOTA, UNLIMITED_QUOTA } from './Constants';
export type { AccessLevel, Changes, DeserialiserFunction, Payload, Quota, Quotas, SerialiserFunction } from './Types';
export { deserialise, onChangedFactory, serialise } from './utils';
export { default as LocalStorageArea } from './LocalStorageArea';
export { default as ManagedStorageArea } from './ManagedStorageArea';
export { default as SessionStorageArea } from './SessionStorageArea';
export { default as SyncStorageArea } from './SyncStorageArea';
