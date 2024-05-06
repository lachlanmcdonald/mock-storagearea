# @lmcd/mock-storagearea

[![Build](https://github.com/lachlanmcdonald/mock-storagearea/actions/workflows/build.yml/badge.svg?branch=main)][build-link] [![npm version](https://badge.fury.io/js/%40lachlanmcdonald%2Fmock-storagearea.svg)][package-link] [![License](https://img.shields.io/badge/License-MIT-blue.svg)][license-link] 

__mock-storagearea__ is a implementation of Chrome's [extension storage interface](https://developer.chrome.com/docs/extensions/reference/storage/), i.e. `chrome.storage`. This package is primarily intended for use in development and testing of extensions outside of a browser.

__Notes:__ 

- [Manifest V3 introduced support for promises](https://developer.chrome.com/docs/extensions/mv3/promises/), where as versions prior used a callback argument. This implementation <u>is not</u>  backwards-compatible with callbacks and only supports promises. Providing a callback will throw an exception.
- The `chrome.storage` documentation is often vague. Whilst attempts have been made to identify and replicate any undocumented behaviour, some discrepancies may exist across versions and browsers. Whilst behaviour was validated on the Chrome browser, this library should also function similarly with browsers which implement the [Chromium-based extension API](https://developer.chrome.com/docs/extensions/reference/).
- Due to the usage of `structuredClone`, this package only supports Node 18+.

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

> See: [Listening to changes](https://github.com/lachlanmcdonald/mock-storagearea/wiki/Listening-to-changes)

## Quotas

Normally, quotas are defined by the browser and not configurable by the extension. However, for testing purposes, the quota constraints can be overwritten during initialisation.

> See: [Adjusting quotas](https://github.com/lachlanmcdonald/mock-storagearea/wiki/Adjusting-quotas)

### Serialisation

> It is best practice to not rely on Chrome's serialisation behaviour and instead serialise/deserialise your values into strings before storage.

> See: [Serialisation & deserialisation](https://github.com/lachlanmcdonald/mock-storagearea/wiki/Serialisation-&-deserialisation) and [storage size](https://github.com/lachlanmcdonald/mock-storagearea/wiki/Storage-size)

## Tests

```shell
npm run build
npm run test
```

[build-link]: https://github.com/lachlanmcdonald/mock-storagearea/actions
[package-link]: https://www.npmjs.com/package/@lmcd/mock-storagearea
[license-link]: https://github.com/lachlanmcdonald/mock-storagearea/blob/main/LICENSE
[API]: https://github.com/lachlanmcdonald/mock-storagearea/wiki/API
