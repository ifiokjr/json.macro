# json.macro

[![GitHub Actions Build Status](https://github.com/ifiokjr/json.macro/workflows/Node%20CI/badge.svg)](https://github.com/ifiokjr/json.macro/actions?query=workflow%3A%22Node+CI%22)
[![Version][version]][npm]
[![Weekly Downloads][downloads-badge]][npm]
[![Typed Codebase][typescript]](./src/index.ts)
![MIT License][license]
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

<br />

> Load any json file at build time using babel-plugin-macros.

<br />

## Table of Contents

- [json.macro](#jsonmacro)
  - [Table of Contents](#table-of-contents)
  - [Usage](#usage)
    - [Setup](#setup)
        - [`.babelrc`](#babelrc)
        - [`babel.config.js`](#babelconfigjs)
    - [Code Example](#code-example)
  - [Pitfalls](#pitfalls)
  - [API](#api)
    - [`json.macro/types`](#jsonmacrotypes)
  - [Contributing](#contributing)
  - [Versioning](#versioning)
  - [License](#license)
  - [Contributors](#contributors)

<br />

## Usage

`json.macro` is designed to be used with [babel-plugin-macros](https://github.com/kentcdodds/babel-plugin-macros) to inline all your json file imports.

<br />

### Setup

First, install the plugin and it's peer dependency (`babel-plugin-macros`). Since the macro is compiled away during the build, it should be installed as a development dependency.

```bash
npm install --save-dev json.macro babel-plugin-macros
```

or

```bash
yarn add -D json.macro babel-plugin-macros
```

Once installed make sure to add the 'babel-plugin-macros' to your `babel.config.js` (or `.babelrc`) file.

##### `.babelrc`

```diff
{
  "plugins": [
    "other-plugins",
+   "macros",
  ]
}
```

##### `babel.config.js`

```diff
module.exports = {
  // rest of config...,
  plugins: [
    ...otherPlugins,
+   'macros',
  ]
}
```

<br />

### Code Example

For the following json file: `./my-json.json` this code will load a json file from the provided path. The path can be relative to the file it's being used from or an absolute path. If the file can't be resolved the build will fail.

`/path/to/my-json.json`

```json
{
  "custom": 1
}
```

This will load it

`/path/to/my-js.js`

```js
import { loadJson } from 'json.macro';

const myJson = loadJson('./my-json.json');
```

Compiles to ↓ ↓ ↓ ↓ ↓ ↓

```js
const myJson = { custom: 1 };
```

Like magic :-)




<br />


## Pitfalls

Avoid chaining calls to any of the methods exported by this package. While it may work sometimes the function calls are compiled away which can lead to syntactic errors.

For example.

`./hello.json`

```json
{ "hello": "world" }
```

`./file.js`

```js
import { loadJson } from 'json.macro';

const helloWorld = loadJson('./hello.json').hello;
```

While the above is valid javascript it would lead to a syntax error due to the way the macro will be compiled.

The compiled output will look like this.

```js
const helloWorld = { hello: 'world' }.hello;
```

This code is not valid syntax and your build will **blow up**.

<br />

## API

The best way to learn about the API is be reading through the definition file documentation in [`json.macro.d.ts`](https://github.com/ifiokjr/json.macro/blob/master/json.macro.d.ts)

### `json.macro/types`

You might find yourself wanting to use the `PackageJson` or `TsConfigJson` types in your own code. For this reason this file re-exports them from `type-fest` to save you the hassle of adding another direct dependency.

```ts
import { PackageJson, TsConfigJson } from 'json.macro/types';

let pkg: PackageJson;
let tsconfig: TsConfigJson;
```

<br />

## Contributing

Dive into the codebase with Gitpod.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/ifiokjr/json.macro)

<br />

## Versioning

This project uses [SemVer](http://semver.org/) for versioning. For the versions available, see the
[tags on this repository](https://github.com/ifiokjr/json.macro/tags).

<br />

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://ifiokjr.com"><img src="https://avatars2.githubusercontent.com/u/1160934?v=4" width="100px;" alt=""/><br /><sub><b>Ifiok Jr.</b></sub></a><br /><a href="https://github.com/ifiokjr/json.macro/commits?author=ifiokjr" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

[version]: https://flat.badgen.net/npm/v/json.macro
[npm]: https://npmjs.com/package/json.macro
[license]: https://flat.badgen.net/badge/license/MIT/purple
[size]: https://bundlephobia.com/result?p=#json.macro
[size-badge]: https://flat.badgen.net/bundlephobia/minzip/json.macro
[typescript]: https://flat.badgen.net/badge/icon/TypeScript/?icon=typescript&label&labelColor=blue&color=555555
[downloads-badge]: https://badgen.net/npm/dw/json.macro/red?icon=npm
