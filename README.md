# @lachlanmcdonald/mock-storagearea

[![Build](https://github.com/lachlanmcdonald/mock-storagearea/actions/workflows/build.yml/badge.svg?branch=main)][build-link] [![npm version](https://badge.fury.io/js/%40lachlanmcdonald%2Fmock-storagearea.svg)][package-link] [![License](https://img.shields.io/badge/License-MIT-blue.svg)][license-link] 

> __WIP:__ This project is mostly complete but otherwise paused -- as the available documentation of the extension storage interface leaves a lot to be desired in terms of accuracy. At present, there is no demand for this package's completion.

__mock-storagearea__ is a implementation of Chrome's [extension storage interface](https://developer.chrome.com/docs/extensions/reference/storage/), i.e. `chrome.storage`. This package is primarily intended for use in development/testing of extensions outside of the extension context, i.e. to development of UI external to the extension or test automation.

__Notes:__ 

- [Manifest V3 introduced support for promises](https://developer.chrome.com/docs/extensions/mv3/promises/), where as versions prior used a callback argument. This implementation <u>is not</u>  backwards-compatible and only supports promises.
- The `chrome.storage` documentation is often vague or incorrect. Whilst attempts have been made to identify and replicate any undocumented behaviour, some discrepancies may exist across versions and browsers.
- Whilst behaviour was validated on the Chrome browser, this library should also function similarly with browsers which implement the [Chromium-based extension API](https://developer.chrome.com/docs/extensions/reference/).
- Due to the usage of `structuredClone`, this package only supports Node version 18.x and up. See [support tables for browsers](https://caniuse.com/?search=structuredClone).

## Usage

There are four storage areas corresponding to those in Chrome:

```typescript
import {
  SessionStorageArea, 
  LocalStorageArea, 
  SyncStorageArea, 
  ManagedStorageArea, 
  onChanged
} from '@lachlanmcdonald/mock-storagearea';

const session = SessionStorageArea();
const local = LocalStorageArea();
const sync = SyncStorageArea();
const managed = ManagedStorageArea();

const chrome = {
  storage: {
    session,
    local,
    sync,
    managed,
    onChanged: onChanged({ session, local, sync, managed }),
  }
};
```

> See: [API]

## Listening for changes

> See: [Listening to changes](https://github.com/lachlanmcdonald/mock-storagearea/wiki/Listening-to-changes)

## Quotas

Normally, quotas are defined by the browser and not configurable by the extension. However, for testing purposes, the quota constraints can be overwritten during initialisation.

> See: [Adjusting quotas](https://github.com/lachlanmcdonald/mock-storagearea/wiki/Adjusting-quotas)

### Error handling

When an error occurs, such as an exceeded quota, the request would fail and __chrome.storage__ would store the last error as [chrome.runtime.lastError](https://developer.chrome.com/docs/extensions/reference/runtime/#property-lastError). __mock-storagearea__ will return a rejected promise with the exception.

### Serialisation

To avoid issues with serialisation of complex objects, you should always manually serialise and deserialise your data into a string before storing it in a storage area.

> See: [Serialisation & deserialisation](https://github.com/lachlanmcdonald/mock-storagearea/wiki/Serialisation-&-deserialisation) and [storage size](https://github.com/lachlanmcdonald/mock-storagearea/wiki/Storage-size)

## Tests

```shell
npm run build
npm run test
```

[build-link]: https://github.com/lachlanmcdonald/mock-storagearea/actions
[package-link]: https://www.npmjs.com/package/@lachlanmcdonald/mock-storagearea
[license-link]: https://github.com/lachlanmcdonald/mock-storagearea/blob/main/LICENSE
[API]: https://github.com/lachlanmcdonald/mock-storagearea/wiki/API
