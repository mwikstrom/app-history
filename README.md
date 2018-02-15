# app-history [![build status][travis-badge]][travis] [![code coverage][coveralls-badge]][coveralls] [![npm package][npm-badge]][npm]


`app-history` is an extension to [`history`][history] designed for use in progressive web apps. The API is a superset of [`history`][history] so you can use it as a drop-in replacement in [`react-router`][react-router] for example. TypeScript definitions are included.

## Installation

```
npm install --save app-history
```

Or, if you're not using a bundler you can load it into the browser directly as an UMD package. Notice that you'll have to load the [`history`][history] UMD package too:

```html
<script src="https://unpkg.com/history/umd/history.min.js"></script>
<script src="https://unpkg.com/app-history/dist/app-history.js"></script>
```

## Usage

### Create an App History object

If you are using a bundler and NPM:

```js
import { createAppHistory } from "app-history";
const history = createAppHistory();
```

Or, if you've loaded it as an UMD package:

```js
const history = AppHistory.createAppHistory();
```

`createAppHistory` will, by default, create a new browser history using `createBrowserHistory` from the [`history`][history] package.

If you want to provide another underlying history object you can do so (however, it is strongly recommended that you only access the underlying history object via the newly returned `app-history` extension to avoid confusion):

```js
const history = AppHistory.createAppHistory({
    source: myHistoryObject
});
```

`app-history` is based on HTML5 History API state objects. So make sure that the underlying history object has support for that.

`app-history` will internally store some meta information in HTML5 History API state objects. One piece of information is a cache of app-specific paths in the history back stack. By default, the cache is limited to 20 entries. If you want to change this you can do so:

```js
const history = AppHistory.createAppHistory({
    cacheLimit: 5 // Keep at most five paths cached in my state objects
});
```

If you want to disable caching:

```js
const history = AppHistory.createAppHistory({
    cacheLimit: 0 // No cached paths in my state objects
});
```

Or if you want to let the cache grow indefinately:

```js
const history = AppHistory.createAppHistory({
    cacheLimit: -1 // Cache 'em all!
});
```

<!-- TODO: Usage -->
<!-- TODO: Why? -->
<!-- TODO: How? -->

[travis-badge]: https://img.shields.io/travis/mwikstrom/app-history.svg?style=flat-square
[travis]: https://travis-ci.org/mwikstrom/app-history
[coveralls-badge]: https://img.shields.io/coveralls/github/mwikstrom/app-history.svg?style=flat-square
[coveralls]: https://coveralls.io/github/mwikstrom/app-history
[npm-badge]: https://img.shields.io/npm/v/app-history.svg?style=flat-square
[npm]: https://www.npmjs.org/package/app-history
[history]: https://github.com/ReactTraining/history
[react-router]: https://github.com/ReactTraining/react-router
