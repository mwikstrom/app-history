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
history.suppress(() => {
    // code in this callback won't notify listeners or invoke block prompt
});
```

You can at any time determine whether notifications and prompts are being suppressed:

```js
console.log("Suppression is ", history.isSuppressed ? "active" : "inactive");
```

### Invocation chaining

`app-history` lets you use invocation chaining on all methods that would otherwise return void. 

This includes the following methods from [`history`][history]:
* `go`
* `goBack`
* `goForward`
* `push`
* `replace`

And these extension methods:
* `cut`
* `goHome`
* `suppress` (when using a callback function)

### Inspecting the in-app back stack

**TODO**

### Use a custom underlying history object

`createAppHistory` will, by default, create a new browser history using `createBrowserHistory` from the [`history`][history] package.

If you want to provide another underlying history object you can do so (however, it is strongly recommended that you only access the underlying history object via the newly returned `app-history` extension to avoid confusion):

```js
const history = createAppHistory({
    source: myHistoryObject
});
```

`app-history` is based on HTML5 History API state objects. So make sure that the underlying history object has support for that.

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