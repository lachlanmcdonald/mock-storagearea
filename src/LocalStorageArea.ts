import { CHROME_LOCAL_STORAGE_DEFAULT_QUOTA } from './Constants';
import StorageArea from './StorageArea';
import { DeserialiserFunction, Payload, Quotas, SerialiserFunction } from './Types';

export default class LocalStorageArea extends StorageArea {
	__areaName = 'local';

	constructor(payload?: Payload, quotas?: Quotas, serialiser?: SerialiserFunction, deserialiser?: DeserialiserFunction) {
		super(payload, {
			...CHROME_LOCAL_STORAGE_DEFAULT_QUOTA,
			...quotas || {},
		}, serialiser, deserialiser);
	}
}
