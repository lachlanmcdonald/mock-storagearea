# @lmcd/mock-storagearea

[![Build](https://github.com/lachlanmcdonald/mock-storagearea/actions/workflows/build.yml/badge.svg?branch=main)][build-link] [![npm version](https://badge.fury.io/js/%40lmcd%2Fmock-storagearea.svg)][package-link] [![License](https://img.shields.io/badge/License-MIT-blue.svg)][license-link] 

__mock-storagearea__ is a implementation of Chrome's [extension storage interface](https://developer.chrome.com/docs/extensions/reference/storage/), i.e. `chrome.storage`. This package is intended for use in development and testing of extensions outside of a browser.

## Usage

> See: [API]

This module exports four storage areas, each corresponding to those in Chrome:

```typescript
import {
	createLocalStorageArea,
	createSessionStorageArea,
	createSyncStorageArea,
	createManagedStorageArea,
	onChanged,
} from '@lmcd/mock-storagearea';

const local = createLocalStorageArea();
const session = createSessionStorageArea();
const sync = createSyncStorageArea();
const managed = createManagedStorageArea();

const chrome = {
	storage: {
		local,
		session,
		sync,
		managed,
		onChanged: onChanged({ session, local, sync, managed }),
	}
};
```


## Listening for changes

See: [Listening to changes](https://github.com/lachlanmcdonald/mock-storagearea/wiki/Listening-to-changes)

## Quotas

Normally, quotas are defined by the browser and not configurable by the extension. However, for testing purposes, the quota constraints can be overwritten during initialisation.

See: [Adjusting quotas](https://github.com/lachlanmcdonald/mock-storagearea/wiki/Adjusting-quotas)

### Serialisation

> It is best practice to not rely on Chrome's serialisation behaviour and instead serialise/deserialise your values into strings before storage. However, this package attempt's to implement identical serialisation/deserialisation techniques as Chrome.

See: [Serialisation & deserialisation](https://github.com/lachlanmcdonald/mock-storagearea/wiki/Serialisation-&-deserialisation) and [storage size](https://github.com/lachlanmcdonald/mock-storagearea/wiki/Storage-size)

## Notes

- [Manifest V3 introduced support for promises](https://developer.chrome.com/docs/extensions/mv3/promises/), where as versions prior used a callback argument. This implementation is not backwards-compatible with callbacks and only supports promises. Providing a callback will throw an exception.
- Whilst attempts have been made to identify and replicate any undocumented behaviour in the `chrome.storage` documentation, some discrepancies may exist across versions and browsers. This package is intended to work with any browser which implements the [Chromium-based extension API](https://developer.chrome.com/docs/extensions/reference/).
- Due to the usage of `structuredClone`, this package only supports Node 18+.

## Tests

```shell
pnpm run build
pnpm run test
```

[build-link]: https://github.com/lachlanmcdonald/mock-storagearea/actions
[package-link]: https://www.npmjs.com/package/@lmcd/mock-storagearea
[license-link]: https://github.com/lachlanmcdonald/mock-storagearea/blob/main/LICENSE
[API]: https://github.com/lachlanmcdonald/mock-storagearea/wiki/API
