import incrementWriteQuota from './incrementWriteQuota';

const TIMESTAMP = new Date(Date.UTC(2023, 0, 1, 12, 0, 0)).valueOf();

test('Does not throw when below the quota', () => {
	const writesPerHourCache = {} as Record<string, number>;
	const writesPerMinuteCache = {} as Record<string, number>;

	expect(() => {
		incrementWriteQuota(1, 1, writesPerHourCache, writesPerMinuteCache, TIMESTAMP);
	}).not.toThrow();
});

test('Throws when over the the MAX_WRITE_OPERATIONS_PER_MINUTE quota', () => {
	const writesPerHourCache = {} as Record<string, number>;
	const writesPerMinuteCache = {} as Record<string, number>;

	expect(() => {
		incrementWriteQuota(Infinity, 3, writesPerHourCache, writesPerMinuteCache, TIMESTAMP);
		incrementWriteQuota(Infinity, 3, writesPerHourCache, writesPerMinuteCache, TIMESTAMP);
		incrementWriteQuota(Infinity, 3, writesPerHourCache, writesPerMinuteCache, TIMESTAMP);
	}).not.toThrow();

	expect(() => {
		incrementWriteQuota(Infinity, 3, writesPerHourCache, writesPerMinuteCache, TIMESTAMP);
	}).toThrow('Quota exceeded: MAX_WRITE_OPERATIONS_PER_MINUTE');
});

test('Throws when over the the MAX_WRITE_OPERATIONS_PER_HOUR quota', () => {
	const writesPerHourCache = {} as Record<string, number>;
	const writesPerMinuteCache = {} as Record<string, number>;

	expect(() => {
		incrementWriteQuota(3, Infinity, writesPerHourCache, writesPerMinuteCache, TIMESTAMP);
		incrementWriteQuota(3, Infinity, writesPerHourCache, writesPerMinuteCache, TIMESTAMP);
		incrementWriteQuota(3, Infinity, writesPerHourCache, writesPerMinuteCache, TIMESTAMP);
	}).not.toThrow();

	expect(() => {
		incrementWriteQuota(3, Infinity, writesPerHourCache, writesPerMinuteCache, TIMESTAMP);
	}).toThrow('Quota exceeded: MAX_WRITE_OPERATIONS_PER_HOUR');
});
