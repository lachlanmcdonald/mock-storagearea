/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */

/**
 * Records a write in the cache or throws if doing so would exceed the specified limits.
 *
 * __Note:__ This operation directly modifies `writesPerHourCache` and `writesPerMinuteCache`
 * (as they are passed by reference.)
 *
 * @param maxWritesPerHour Maximum number of writes per hour
 * @param maxWritesPerMinute Maximum number of writes per minute
 * @param writesPerHourCache Cache containing a tally of writes, keyed to the hour
 * @param writesPerMinuteCache Cache containing a tally of writes, keyed to the minute
 */
export default function incrementWriteQuota(maxWritesPerHour: number, maxWritesPerMinute: number, writesPerHourCache: Record<string, number>, writesPerMinuteCache: Record<string, number>, timestamp?: number | null) {
	const now = new Date(typeof timestamp === 'number' ? timestamp : Date.now());
	const fullDaysSinceEpoch = Math.floor(now.valueOf() / 86400000);
	const hourKey = `${ fullDaysSinceEpoch }:${ now.getHours }`;
	const minuteKey = `${ hourKey }:${ now.getMinutes }`;

	if (Number.isFinite(maxWritesPerHour)) {
		if (Object.hasOwn(writesPerHourCache, hourKey)) {
			if (writesPerHourCache[hourKey] + 1 > maxWritesPerHour) {
				throw new Error(`Quota exceeded: MAX_WRITE_OPERATIONS_PER_HOUR (${ maxWritesPerHour }) was exceeded.`);
			} else {
				writesPerHourCache[hourKey] += 1;
			}
		} else {
			writesPerHourCache[hourKey] = 1;
		}
	}

	if (Number.isFinite(maxWritesPerMinute)) {
		if (Object.hasOwn(writesPerMinuteCache, minuteKey)) {
			if (writesPerMinuteCache[minuteKey] + 1 > maxWritesPerMinute) {
				throw new Error(`Quota exceeded: MAX_WRITE_OPERATIONS_PER_MINUTE (${ maxWritesPerMinute }) was exceeded.`);
			} else {
				writesPerMinuteCache[minuteKey] += 1;
			}
		} else {
			writesPerMinuteCache[minuteKey] = 1;
		}
	}
}
