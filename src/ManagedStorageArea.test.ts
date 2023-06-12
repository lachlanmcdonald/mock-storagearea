import ManagedStorageArea from './ManagedStorageArea';

test('Calling set() throws an error', () => {
	const k = new ManagedStorageArea();

	expect(k.set({
		test: 123,
	})).rejects.toThrow(/cannot mutate/ui);
});

test('Calling remove() throws an error', () => {
	const k = new ManagedStorageArea();

	expect(k.remove('test')).rejects.toThrow(/cannot mutate/ui);
});

test('Calling clear() throws an error', () => {
	const k = new ManagedStorageArea();

	expect(k.clear()).rejects.toThrow(/cannot mutate/ui);
});