# app-history [![build status][travis-badge]][travis] [![code coverage][coveralls-badge]][coveralls] [![npm package][npm-badge]][npm]


`app-history` is an extension to [`history`][history] designed for use in progressive web apps. The API is a superset of [`history`][history] so you can use it as a drop-in replacement in [`react-router`][react-router] for example. TypeScript definitions are included.

## Objective

**TODO**

## Installation

Using [NPM](npm) and a bundler (like [webpack][webpack]):

```
npm install --save app-history
```

Then create an App History object in your code like this:

```js
import { createAppHistory } from "app-history";
const history = createAppHistory();
```

Use it with [`react-router`][react-router] something like this:

```jsx
import * as React from "react";
import { render } from "react-dom";
import { Router } from "react-router";
import { createAppHistory } from "app-history";

import { App } from "./App"; // Your app root component

// Create App History object (extending Browser History)
const history = createAppHistory();

// Create a <div> that will host the App component
const root = document.createElement("div");
document.body.appendChild(root);

// Tell React to render our app. Wrap it inside a Router component
// which is configured to use the App History object.
render(
    <Router history={history}>
        <App/>
    </Router>,
    root
);
```


----------

Alternatively, you can load it directly from the [UNPKG][unpkg] CDN using vanilla HTML and JavaScript:

```html
<script src="https://unpkg.com/history/umd/history.min.js"></script>
<script src="https://unpkg.com/app-history/dist/app-history.js"></script>
```

(Notice that you'll have to load the [`history`][history] UMD package too)

Then create an App History object in your code like this:

```js
const history = AppHistory.createAppHistory({ provider: History });
```

## Usage

### Going back

**TODO**

### Going home

**TODO**

### Cutting history

**TODO**

### In-app navigation depth

The `depth` property of an `app-history` object lets you know how deep into the app you've gone, and thereby how far back you can go and still remain inside the current app session:

```js
console.log("We can navigate back ", history.depth, " entry/entries and still be in this app session");
```

### Suppressing notifications and block prompts

An [`history`][history] object lets you listen on location changes and conditionally block transitions, using `listen` and `block` respectively.

If you which to temporarily pause notifications and prompts you can do:

```js
const resume = history.suppress();

// this will not notify listeners or invoke block prompt
history.pushState("foo", "bar");

// resume normal processing when you're done with the secret stuff
resume();
```

Or using a callback action:

```js
history.suppressWhile(() => {
    // code in this callback won't notify listeners or invoke block prompt
});
```

`suppressWhile` returns a `Promise` object and will await a `Promise` object returned by the callback function.  

You can at any time determine whether notifications and prompts are being suppressed:

```js
console.log("Suppression is ", history.isSuppressed ? "active" : "inactive");
```

### Async promises

`app-history` return promises from all methods that may trigger a location change. These promises are resolved when the new location has been applied, or rejected in case the change is blocked. 

This includes the following methods from [`history`][history]:
* `go`
* `goBack`
* `goForward`
* `push`
* `replace`

And these extension methods:
* `cut`
* `findLast`
* `goHome`
* `init`
* `suppressWhile`
* `whenIdle`

You can determine whether `app-history` is currently processing an async operation by reading the `isBusy` property:

```js
console.log("App history is ", history.isBusy ? "busy" : "idle");
```

### Inspecting the in-app back stack

**TODO**

### Use a custom underlying history object

`createAppHistory` will, by default, create a new browser history using `createBrowserHistory` from the [`history`][history] package.

You can instruct `app-history` to use `createMemoryHistory` (also from the [`history`][history] package) instead, which is helpful when testing your code in a non-browser environment:

```js
const history = createAppHistory({
    mode: "memory"
});
```

If you want to provide another underlying history object you can do so (however, it is strongly recommended that you only access the underlying history object via the newly returned `app-history` extension to avoid confusion):

```js
const history = createAppHistory({
    provider: myHistoryObjectProvider
});
```

The supplied provider object must declare a function named `createBrowserHistory` when `mode` is omitted or set to `"browser"`, or a function named `createMemoryHistory` when `mode` is set to `"memory"`.

`app-history` will invoke the provided function with a configuration object containing a `getUserConfirmation` function, no matter whether such a configuration function was passed to `createAppHistory` or not.

`app-history` is based on HTML5 History API state objects. So make sure that the underlying history object has support for that.

### Specifying a custom block prompt

By default, `app-history` will (just like [`history`][history]) use `window.confirm` to display a prompt when navigation is blocked. You can provide a custom prompt to `createAppHistory`:

```js
const history = createAppHistory({
    getUserConfirmation(message, callback) {
        callback(window.confirm(message));
    }
});
```

Please refer to the [`history`][history] package for details.

### Configure the internal cache limit

`app-history` will internally store some meta information in HTML5 History API state objects. One piece of information is a cache of app-specific paths in the history back stack. By default, the cache is limited to 20 entries. If you want to change this you can do so:

```js
const history = createAppHistory({
    cacheLimit: 5 // Keep at most five paths cached in my state objects
});
```

If you want to disable caching:

```js
const history = createAppHistory({
    cacheLimit: 0 // No cached paths in my state objects
});
```

Or if you want to let the cache grow indefinately:

```js
const history = createAppHistory({
    cacheLimit: -1 // Cache 'em all!
});
```

You can read the currect cache limit like this:

```js
console.log("The app history cache limit is set to: ", history.cacheLimit);
```

[travis-badge]: https://img.shields.io/travis/mwikstrom/app-history.svg?style=flat-square
[travis]: https://travis-ci.org/mwikstrom/app-history
[coveralls-badge]: https://img.shields.io/coveralls/github/mwikstrom/app-history.svg?style=flat-square
[coveralls]: https://coveralls.io/github/mwikstrom/app-history
[npm-badge]: https://img.shields.io/npm/v/app-history.svg?style=flat-square
[npm]: https://www.npmjs.org/package/app-history
[history]: https://github.com/ReactTraining/history
[react-router]: https://github.com/ReactTraining/react-router
[npm]: https://www.npmjs.com/
[webpack]: https://webpack.github.io/
[unpkg]: https://unpkg.com/