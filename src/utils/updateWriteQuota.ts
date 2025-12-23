/*
 * Copyright (c) 2024 Lachlan McDonald. All rights reserved.
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
export default function updateWriteQuota(maxWritesPerHour: number, maxWritesPerMinute: number, writesPerHourCache: Map<number, number>, writesPerMinuteCache: Map<number, number>, timestamp?: number) {
	const hasFiniteMaxWritesPerHour = Number.isFinite(maxWritesPerHour);
	const hasFiniteMaxWritesPerMinute = Number.isFinite(maxWritesPerMinute);

	if (hasFiniteMaxWritesPerHour || hasFiniteMaxWritesPerMinute) {
		const now = (typeof timestamp === 'number') ? new Date(timestamp) : new Date();

		const hoursSinceEpoch = Math.floor(now.valueOf() / 3_600_000);
		const minutesInDay = (now.getHours() * 60) + now.getMinutes();

		if (hasFiniteMaxWritesPerHour) {
			let v = writesPerHourCache.get(hoursSinceEpoch);

			if (typeof v !== 'number' || Number.isFinite(v) === false) {
				v = 0;
			}

			if ((v + 1) > maxWritesPerHour) {
				throw new Error(`Quota exceeded: MAX_WRITE_OPERATIONS_PER_HOUR (${ maxWritesPerHour }) was exceeded.`);
			}

			writesPerHourCache.set(hoursSinceEpoch, v + 1);
		}

		if (hasFiniteMaxWritesPerMinute) {
			let v = writesPerMinuteCache.get(minutesInDay);

			if (typeof v !== 'number' || Number.isFinite(v) === false) {
				v = 0;
			}

			if ((v + 1) > maxWritesPerMinute) {
				throw new Error(`Quota exceeded: MAX_WRITE_OPERATIONS_PER_MINUTE (${ maxWritesPerMinute }) was exceeded.`);
			}

			writesPerMinuteCache.set(minutesInDay, v + 1);
		}
	}
}
