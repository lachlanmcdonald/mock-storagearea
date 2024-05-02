import { CHROME_LOCAL_STORAGE_DEFAULT_QUOTA, CHROME_MANAGED_STORAGE_DEFAULT_QUOTA, CHROME_SESSION_STORAGE_DEFAULT_QUOTA, CHROME_SYNC_STORAGE_DEFAULT_QUOTA } from './Constants';
import { StorageAreaFactory } from './StorageAreaFactory';
import Store from './Store';
import { Quota } from './Types';

type StorageAreaFactoryWithQuota<T> = Readonly<Omit<ReturnType<typeof StorageAreaFactory>, keyof Quota> & T>;

type SyncStorageAreaInterface = StorageAreaFactoryWithQuota<typeof CHROME_SYNC_STORAGE_DEFAULT_QUOTA>;
type LocalStorageAreaInterface = StorageAreaFactoryWithQuota<typeof CHROME_LOCAL_STORAGE_DEFAULT_QUOTA>;
type SessionStorageAreaInterface = StorageAreaFactoryWithQuota<typeof CHROME_SESSION_STORAGE_DEFAULT_QUOTA>;
type ManagedStorageAreaInterface = StorageAreaFactoryWithQuota<typeof CHROME_MANAGED_STORAGE_DEFAULT_QUOTA>;

export const SyncStorageArea = (initialStore?: Store) : SyncStorageAreaInterface => {
	return StorageAreaFactory(initialStore, CHROME_SYNC_STORAGE_DEFAULT_QUOTA);
};

export const LocalStorageArea = (initialStore?: Store) : LocalStorageAreaInterface => {
	return StorageAreaFactory(initialStore, CHROME_LOCAL_STORAGE_DEFAULT_QUOTA);
};

export const SessionStorageArea = (initialStore?: Store) : SessionStorageAreaInterface => {
	return StorageAreaFactory(initialStore, CHROME_SESSION_STORAGE_DEFAULT_QUOTA);
};

export const ManagedStorageArea = (initialStore?: Store) => {
	/**
	 * Removes all items from the _Storage Area_.
	 */
	const clear = (): Promise<void> => {
		try {
			throw new Error(`clear() Cannot mutate a managed storage area.`);
		} catch (e) {
			return Promise.reject(e);
		}
	};

	/**
	 * Removes one or more items from storage.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const remove = (_keys: string | string[]): Promise<void> => {
		try {
			throw new Error(`remove() Cannot mutate a managed storage area.`);
		} catch (e) {
			return Promise.reject(e);
		}
	};

	/**
	 * Sets multiple items.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const set = (_items: Record<string, any>): Promise<void> => {
		try {
			throw new Error(`set() Cannot mutate a managed storage area.`);
		} catch (e) {
			return Promise.reject(e);
		}
	};

	return Object.freeze({
		...StorageAreaFactory(initialStore),
		clear,
		remove,
		set,
	}) as ManagedStorageAreaInterface;
};
