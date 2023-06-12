import { UNLIMITED_QUOTA } from './Constants';
import { Store } from './Store';

export type Payload = Iterable<any>

export type SerialiserFunction = (value: unknown, parentIsArray?: boolean, parentIsObject?: boolean) => string | null

export type DeserialiserFunction = (value: string) => any

export type OnChangedChanges = {
	[key: string]: {
		oldValue: any,
		newValue: any,
	}
}

export type OnChangedListener = (changes: OnChangedChanges, areaName: string) => void;

export type Quota = keyof typeof UNLIMITED_QUOTA

export type Quotas = Partial<Record<Quota, number>>

export enum AccessLevel {
	TRUSTED_CONTEXTS = 'TRUSTED_CONTEXTS',
	TRUSTED_AND_UNTRUSTED_CONTEXTS = 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
}

export type PropertyChanges = Record<string, {
	before: {
		value: string | null
		exists: boolean
	}
	after: {
		value: string | null
		exists: boolean
	}
}>

export type Changes = {
	before: Store
	after: Store
	changes: PropertyChanges
}
