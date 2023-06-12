# @lachlanmcdonald/mock-storagearea

__mock-storagearea__ is a implementation of Chrome's [extension storage interface](StorageArea) (as distinct from the [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API), such as [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).) It is primarily intended for use in development/testing of extensions outside of the browser context, i.e. to development of UI external to the extension or test automation.

> __Notes:__ 
> - Manifest V3 introduced support for promises, where as versions prior used a callback argument. This implementation does not attempt to be backwards compatible and will <u>only</u> support promises.
> - The chrome.storage documentation is often vague. Whilst an attempt has been made to identify and replicate any undocumented behaviour, some discrepancies may exist across versions and browsers.

> __Beta release:__ The package version will remain in <u>beta</u> until it can be more thoroughly tested. Whilst the tests are comprehensive, some behaviour may not properly replicate that of Chrome. Please [raise an issue](https://github.com/lachlanmcdonald/mock-storagearea/issues) if you encounter an irregularity.

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

> See: [API]


### Adjusting quotas

Normally, quotas are defined by the browser and not configurable by the extension. However, for testing purposes, the quota constraints can be overwritten during initialisation:

```ts
const syncStorageArea = new SyncStorageArea(null, {
	MAX_ITEMS: 100,
});
```

> See: [Adjusting quotas](https://github.com/lachlanmcdonald/mock-storagearea/wiki/Adjusting-quotas)

### Error handling

Wnen an error occurs, such as an exceeded quota, the request would fail and __chrome.storage__ would store the last error as [chrome.runtime.lastError](https://developer.chrome.com/docs/extensions/reference/runtime/#property-lastError). __mock-storagearea__ will return a rejected promise with the exception.

### Serialisation

To avoid issues with serialisation of complex objects, you should always manually serialise and deserialise your data into a string before storing it in a storage area.

> See: [Serialisation & deserialisation](https://github.com/lachlanmcdonald/mock-storagearea/wiki/Serialisation-&-deserialisation)

### Storage size

> See: [Storage size](https://github.com/lachlanmcdonald/mock-storagearea/wiki/Storage-size)

## Tests

```shell
npm run build
npm run test
```

[API]: https://github.com/lachlanmcdonald/mock-storagearea/wiki/API
[StorageArea]: https://developer.chrome.com/docs/extensions/reference/storage/
