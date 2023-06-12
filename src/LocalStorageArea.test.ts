import { CHROME_LOCAL_STORAGE_DEFAULT_QUOTA } from './Constants';
import LocalStorageArea from './LocalStorageArea';

describe('Quotas are set to the defaults', () => {
	const tests = Object.entries(CHROME_LOCAL_STORAGE_DEFAULT_QUOTA) as Array<[ keyof typeof CHROME_LOCAL_STORAGE_DEFAULT_QUOTA, number ]>;

	test.each(tests)('%s is %p', (property, value) => {
		const k = new LocalStorageArea();

		expect(k.__quotas[property]).toBe(value);
	});
});