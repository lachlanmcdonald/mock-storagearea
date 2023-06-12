# @lachlanmcdonald/mock-storagearea

__mock-storagearea__ is a implementation of Chrome's [extension storage interface](StorageArea) (as distinct from the [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API), such as [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).) It is primarily intended for use in development/testing of extensions outside of the browser context, i.e. to development of UI external to the extension or test automation.

> __Note:__ Manifest V3 introduced support for promises, where as versions prior used a callback argument. This implementation does not attempt to be backwards compatible and will <u>only</u> support promises.

> __Note:__ The chrome.storage documentation is often vague. Whilst an attempt has been made to identify and replicate any undocumented behaviour, some discrepancies may exist across versions and browsers.

## Usage

There are four storage areas corresponding to those in Chrome:

```ts
import { LocalStorageArea } from '@lachlanmcdonald/mock-storagearea';
import { ManagedStorageArea } from '@lachlanmcdonald/mock-storagearea';
import { SessionStorageArea } from '@lachlanmcdonald/mock-storagearea';
import { SyncStorageArea } from '@lachlanmcdonald/mock-storagearea';

const chrome = {
  storage: {
    local: new LocalStorageArea(),
    managed: new ManagedStorageArea(),
    session: new SessionStorageArea(),
    sync: new SyncStorageArea(),
  }
};
```

The constructor accepts a single argument to pre-populate the contents of the store. The value of that is the same as the [Map constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/Map).

__Notes:__

- __LocalStorageArea__ and __SessionStorageArea__ are functionally identical and both implement a quota on the entire storage area.
- __ManagedStorageArea__ is read-only and attempt to mutate the storage will throw an error. The contents of the __ManagedStorageArea__ can only be specified during initialisation.
- __SyncStorageArea__ enforces additional quotas on the storage area, including a per-item quota, maximum number of items, and limits on the number of write operations per minute and hour.

### onChanged

To imitate `chrome.storage.onChanged`, pass the storage areas to the `onChangedFactory` function:

```ts
import { onChangedFactory, LocalStorageArea, SyncStorageArea } from '@lachlanmcdonald/mock-storagearea';

const localStorageArea = new LocalStorageArea();
const syncStorageArea = new SyncStorageArea();

const chrome = {
	storage: {
		local: localStorageArea,
		sync: syncStorageArea,
		onChanged: onChangedFactory([ localStorageArea, syncStorageArea ]),
	},
};

chrome.storage.onChanged.addListener(() => {
	// ...
});
```

### Adjusting quotas

Normally, quotas are defined by the browser and not configurable by the extension. However, for testing purposes, the quota constraints can be overwritten during initialisation:

```ts
const syncStorageArea = new SyncStorageArea(null, {
	MAX_ITEMS: 100,
});
```

__Notes:__

- Time-based quotas are set to the local timezone.
- `MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE` has no affect but included for completeness.
- To disable a quota, set its value to `Infinity`

### Error handling

Wnen an error occurs, such as an exceeded quota, the request would fail and __chrome.storage__ would store the last error as [chrome.runtime.lastError](https://developer.chrome.com/docs/extensions/reference/runtime/#property-lastError). 

__mock-storagearea__ will return a rejected promise with the exception.

### Serialisation

To avoid issues with serialisation of complex objects, you should always manually serialise and deserialise your data into a string before storing it in a Storage Area.

> See [Serialisation & deserialisation](https://github.com/lachlanmcdonald/mock-storagearea/wiki/Serialisation-&-deserialisation)

### Storage size

The size of an item is calculated as the _string length of the key_ plus the _string length of the serialised value_. This is not guaranteed to be accurate across browser implementations.

## Tests

```shell
npm run build
npm run test
```

[StorageArea]: https://developer.chrome.com/docs/extensions/reference/storage/
[Map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
[BigInt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
[TypedArray]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
[ArrayBuffer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
[DataView]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
