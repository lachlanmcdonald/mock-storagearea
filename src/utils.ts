import OnChangedEventTarget from './OnChangedEventTarget';
import StorageArea from './StorageArea';
import { Store } from './Store';
import { Changes, DeserialiserFunction, SerialiserFunction } from './Types';

export const StoreChangeFactory = (before: Store, after: Store) => {
	return {
		before,
		after,
		changes: before.compare(after),
	} as Changes;
};

export const onChangedFactory = (areas: StorageArea[]) => {
	const eventTarget = new OnChangedEventTarget();

	areas.forEach(area => {
		area.__eventTargets.add(eventTarget);
	});

	return eventTarget;
};

/**
 * Serialises the provided value in accordance with the observed serialisation rules in Chrome (which
 * will differ from the serialisation behaviour in the available documentation.)
 *
 * Returns a string or `null`:
 * - If a string is returned, the property has been successfully serialised.
 * - If `null` is returned, the property should be omitted. Please note that serialise() may also
 *   return the string `"null"`, which as per above, means the value of `null` was successfully serialised.
 *
 * @param parentIsArray Value occurs as an element within an array
 * @param parentIsObject Value occurs as a property within an object
 */
export const serialise: SerialiserFunction = (value: unknown, parentIsArray = false, parentIsObject = false) => {
	const isPrimitive = ['string', 'boolean'].includes(typeof value);
	const isNumber = typeof value === 'number';
	const isUndefined = typeof value === 'undefined';
	const isSymbol = typeof value === 'symbol';
	const isFunction = typeof value === 'function';
	const isFinite = isNumber && Number.isFinite(value);

	if (isPrimitive) {
		return JSON.stringify(value);
	} else if (isNumber) {
		if (isFinite) {
			return JSON.stringify(value);
		} else {
			return parentIsArray || parentIsObject ? JSON.stringify(null) : null;
		}
	} else if (isUndefined || isSymbol) {
		return parentIsArray || parentIsObject ? JSON.stringify(null) : null;
	} else if (isFunction) {
		return parentIsArray ? JSON.stringify(null) : null;
	} else if (Array.isArray(value)) {
		const results = value.map(x => serialise(x, true, false)) as Array<string>;

		// Cannot use JSON.stringify here as the elements are already stringified and it
		// would result in double-encoding.
		return `[${results.join()}]`;
	} else if (typeof value === 'object') {
		if (value === null) {
			return JSON.stringify(null);
		} else if (value instanceof RegExp) {
			// Edge-case where an instance of RegExp may have a lastIndex property
			return '{}';
		} else if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
			throw new TypeError(`Unsupported type passed to serialise: ${typeof value}`);
		} else {
			const properties = Object.getOwnPropertyNames(value) as Array<keyof typeof value>;
			const results = [] as Array<string>;

			for (const property of properties) {
				const k = serialise(value[property], false, true);

				if (typeof k === 'string') {
					results.push(`${JSON.stringify(property)}:${k}`);
				}
			}

			// Cannot use JSON.stringify here as the properties are already stringified and it
			// would result in double-encoding.
			return `{${results.join()}}`;
		}
	} else {
		throw new TypeError(`Unsupported type passed to serialise: ${typeof value}`);
	}
};

/**
 * Unserialises a value previously serialised with {@link serialise()}.
 */
export const deserialise: DeserialiserFunction = (value: string) => {
	return JSON.parse(value);
};

export const notifyEventTargets = (eventTargets: Set<OnChangedEventTarget>, changes: Changes, area: StorageArea) => {
	for (const target of eventTargets) {
		const temp = {} as Record<string, {
			oldValue: any,
			newValue: any,
		}>;

		for (const key in changes.changes) {
			if (Object.hasOwn(changes.changes, key)) {
				const k = changes.changes[key];

				temp[key] = {
					oldValue: k.before.exists ? k.before.value : undefined, // eslint-disable-line no-undefined
					newValue: k.after.exists ? k.after.value : undefined, // eslint-disable-line no-undefined
				};
			}
		}

		target.dispatch(temp, area.__areaName);
	}
};

/**
 * Records a write in the cache or throws if doing so would exceed the specified limits.
 *
 * __Note:__ This operation directly modifies `writesPerHourCache` and `writesPerMinuteCache`.
 *
 * @param maxWritesPerHour Maximum number of writes per hour
 * @param maxWritesPerMinute Maximum number of writes per minute
 * @param writesPerHourCache Cache containing a tally of writes, keyed to the hour
 * @param writesPerMinuteCache Cache containing a tally of writes, keyed to the minute
 */
export const incrementWriteQuota = (maxWritesPerHour: number, maxWritesPerMinute: number, writesPerHourCache: Record<string, number>, writesPerMinuteCache: Record<string, number>) => {
	const now = new Date(Date.now());
	const fullDaysSinceEpoch = Math.floor(now.valueOf() / 8.64e7);
	const hourKey = `${fullDaysSinceEpoch}:${now.getHours}`;
	const minuteKey = `${hourKey}:${now.getMinutes}`;

	if (Number.isFinite(maxWritesPerHour)) {
		if (Object.hasOwn(writesPerHourCache, hourKey)) {
			if (writesPerHourCache[hourKey] + 1 > maxWritesPerHour) {
				throw new Error(`Quota exceeded: MAX_WRITE_OPERATIONS_PER_HOUR (${maxWritesPerHour}) was exceeded.`);
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
				throw new Error(`Quota exceeded: MAX_WRITE_OPERATIONS_PER_MINUTE (${maxWritesPerMinute}) was exceeded.`);
			} else {
				writesPerMinuteCache[minuteKey] += 1;
			}
		} else {
			writesPerMinuteCache[minuteKey] = 1;
		}
	}
};
