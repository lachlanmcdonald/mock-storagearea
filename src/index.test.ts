import { CHROME_LOCAL_STORAGE_DEFAULT_QUOTA, LocalStorageArea, ManagedStorageArea, CHROME_SYNC_STORAGE_DEFAULT_QUOTA, SessionStorageArea, SyncStorageArea, UNLIMITED_QUOTA, deserialise, onChangedFactory, serialise } from './index';

describe('Exports', () => {
	test('CHROME_LOCAL_STORAGE_DEFAULT_QUOTA', () => {
		expect(CHROME_LOCAL_STORAGE_DEFAULT_QUOTA).toBeTruthy();
	});

	test('CHROME_SYNC_STORAGE_DEFAULT_QUOTA', () => {
		expect(CHROME_SYNC_STORAGE_DEFAULT_QUOTA).toBeTruthy();
	});

	test('UNLIMITED_QUOTA', () => {
		expect(UNLIMITED_QUOTA).toBeTruthy();
	});

	test('LocalStorageArea', () => {
		expect(LocalStorageArea).toBeTruthy();
	});

	test('ManagedStorageArea', () => {
		expect(ManagedStorageArea).toBeTruthy();
	});

	test('SessionStorageArea', () => {
		expect(SessionStorageArea).toBeTruthy();
	});

	test('SyncStorageArea', () => {
		expect(SyncStorageArea).toBeTruthy();
	});

	test('deserialise', () => {
		expect(deserialise).toBeTruthy();
	});

	test('serialise', () => {
		expect(serialise).toBeTruthy();
	});

	test('onChangedFactory', () => {
		expect(onChangedFactory).toBeTruthy();
	});
});