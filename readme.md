# json.macro

[![GitHub Actions Build Status](https://github.com/ifiokjr/json.macro/workflows/Node%20CI/badge.svg)](https://github.com/ifiokjr/json.macro/actions?query=workflow%3A%22Node+CI%22)
[![Version][version]][npm]
[![Weekly Downloads][downloads-badge]][npm]
[![Typed Codebase][typescript]](./json.macro.d.ts)
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
    - [Code Example](#code-example)
  - [API](#api)
    - [`getVersion()`](#getversion)
      - [Parameters](#parameters)
      - [Description](#description)
      - [Example](#example)
    - [`loadJson()`](#loadjson)
      - [Parameters](#parameters-1)
      - [Description](#description-1)
      - [Examples](#examples)
    - [`loadJsonFiles()`](#loadjsonfiles)
      - [Parameters](#parameters-2)
      - [Description](#description-2)
      - [Examples](#examples-1)
    - [`loadPackageJson()`](#loadpackagejson)
      - [Parameters](#parameters-3)
      - [Description](#description-3)
      - [Examples](#examples-2)
    - [`loadTsConfigJson()`](#loadtsconfigjson)
      - [Description](#description-4)
      - [Example](#example-1)
    - [`writeJson()`](#writejson)
      - [Parameters](#parameters-4)
      - [Description](#description-5)
      - [Examples](#examples-3)
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

**`.babelrc`**

```diff
{
  "plugins": [
    "other-plugins",
+   "macros",
  ]
}
```

**`babel.config.js`**

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

↓ ↓ ↓ ↓ ↓ ↓

```js
const myJson = { custom: 1 };
```

Like magic :-)

<br />

## API

| Function                                              | Description                                                                                                                                                                                                                               |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [getVersion(verbose)](#getversion)                    | Get the semver compatible version from the package.json file.                                                                                                                                                                             |
| [loadJson(filePath, path)](#loadjson)                 | This loads a json file from the provided path. The path can be relative to the file it's being used from, an absolute path, or a path to your <code>node_modules</code> folder.<!-- -->If the file can't be resolved the build will fail. |
| [loadJsonFiles(pattern, ...patterns)](#loadjsonfiles) | Load all the json files matching the provided glob patterns.                                                                                                                                                                              |
| [loadPackageJson()](#loadpackagejson)                 | Load the nearest parent <code>package.json</code> file.                                                                                                                                                                                   |
| [loadTsConfigJson()](#loadtsconfigjson)               | Load the nearest parent <code>tsconfig.json</code> file.                                                                                                                                                                                  |
| [writeJson(json, filePath)](#writejson)               | Write a json object to a relative file path.                                                                                                                                                                                              |

<br />

### `getVersion()`

Get the semver compatible version from the package.json file.

```typescript
export function getVersion(verbose?: false): string;
export function getVersion(verbose: true): SemanticVersion;
```

#### Parameters

| Parameter | Type      | Description                                                       |
| --------- | --------- | ----------------------------------------------------------------- |
| verbose   | `boolean` | When true will return an object representing the semantic version |

#### Description

This will throw a build error if the semver version in your package.json is not valid.

#### Example

```js
import { getVersion } from 'json.macro';

const versionString = getVersion();
const versionStringAlt = getVersion(false);
const versionObject = getVersion(true);
```

↓ ↓ ↓ ↓ ↓ ↓

```js
const versionString = '1.19.2';
const versionStringAlt = '1.19.2';
const versionObject = { major: 1, minor: 19, patch: 2, version: '1.19.2' };
```

<br />

### `loadJson()`

This loads a json file from the provided path. The path can be relative to the file it's being used from, an absolute path, or a path to your `node_modules` folder.

If the file can't be resolved the build will fail.

```typescript
export function loadJson<Type>(filePath: string, path?: string): Type;
```

#### Parameters

| Parameter | Type     | Description                                                 |
| --------- | -------- | ----------------------------------------------------------- |
| filePath  | `string` | the relative file path to reference                         |
| path      | `string` | the object path for the part of the object you want to load |

#### Description

For the following json file: `./my-json.json`

```json
{
  "custom": 1
}
```

This is how to load it at build time.

#### Examples

```js
import { loadJson } from 'json.macro';

const myJson = loadJson('my-json.json');
```

↓ ↓ ↓ ↓ ↓ ↓

```js
const myJson = { custom: 1 };
```

Magic :-)

To load from node_modules you can do something like the following.

```js
import { loadJson } from 'json.macro';

const jsonFromNode = loadJson('json.macro/package.json');
```

The above will be replaced with the full package.json file from the json.macro node_modules package.

If you are using typescript you can specify the expected return type by annotating the variable created.

```ts
import { loadJson } from 'json.macro';

const myJson: { custom: number } = loadJson('my-json.json');
```

If a second parameter is passed, this can also load a specific key path from a json file.

`./my-json.json`

```json
{
  "a": {
    "b": { "c": { "d": 1 } },
    "arr": [1, 2, 3, 4, { "end": true }]
  }
}
```

```js
import { loadJsonPath } from 'json.macro';

const value = loadJsonPath('my-json.json', 'a.b.c.d');
const value2 = loadJsonPath('my-json.json', 'a.arr.4.end');
```

Compiles to
↓ ↓ ↓ ↓ ↓ ↓

```js
const value = 1;
const value2 = true;
```

<br />

### `loadJsonFiles()`

Load all the json files matching the provided patterns.

```typescript
export function loadJsonFiles<Type>(
  pattern: string,
  ...patterns: string[]
): Type[];
```

#### Parameters

| Parameter   | Type       | Description                                           |
| ----------- | ---------- | ----------------------------------------------------- |
| pattern     | `string`   | This function requires at least one json file pattern |
| ...patterns | `string[]` | Multiple patterns can be also be added.               |

#### Description

If no files match then an empty array is returned.

#### Examples

```js
import { loadJsonFiles } from 'json.macro';

const jsonArray = loadJsonFiles('*.json');
```

↓ ↓ ↓ ↓ ↓ ↓

```js
const jsonArray = [{ custom: 1 }, { another: 2 }];
```

If you are using typescript you can specify the expected return type by annotating the variable created.

```ts
import { loadJsonFiles } from 'json.macro';

const jsonArray: Array<{ custom: string }> = loadJsonFiles('*.json');
```

<br />

### `loadPackageJson()`

Load the nearest parent `package.json` file.

```typescript
export function loadPackageJson(): PackageJson;
export function loadPackageJson<Key extends string>(key: Key): PackageJson[Key];
```

#### Parameters

| Parameter | Type                | Description                                                |
| --------- | ------------------- | ---------------------------------------------------------- |
| key       | `keyof PackageJson` | The property you want to load from the `package.json` file |

#### Description

You can also provide a key property which will load the property corresponding to the key from the nearest `package.json`<!-- -->.

#### Examples

```js
import { loadPackageJson } from 'json.macro';

const packageJson = loadPackageJson();
const name = loadPackageJson('name');
```

↓ ↓ ↓ ↓ ↓ ↓

```js
const packageJson = { name: 'my-package', version: '1.0.0', private: true };
const name = '1.0.0';
```

For typescript users, the types are automatically inferred using the `PackageJson` type from the [`type-fest`](https://github.com/sindresorhus/type-fest) library.

<br />

### `loadTsConfigJson()`

Load the nearest parent `tsconfig.json` file.

```typescript
export function loadTsConfigJson(): TsConfigJson;
```

#### Description

You can customise the name of the file searched for.

#### Example

```js
import { loadTsConfigJson } from 'json.macro';

const tsconfig = loadTsConfigJson();
const customTsConfig = loadTsConfigJson('tsconfig.custom.json');
```

↓ ↓ ↓ ↓ ↓ ↓

```js
const tsconfig = { compilerOptions: {} };
const customTsConfig = { compilerOptions: { paths: [] } };
```

For typescript users, the types are automatically inferred using the `TsConfigJson` type from the \[`type-fest`<!-- -->\](https://github.com/sindresorhus/type-fest) library.

<br />

### `writeJson()`

Write a JSON object to a relative file path.

```typescript
export function writeJson<Type>(json: Type, filePath: string): Type;
```

#### Parameters

| Parameter | Type     | Description                               |
| --------- | -------- | ----------------------------------------- |
| json      | `any`    | The json object to be written             |
| filePath  | `string` | Where the json object will be written to. |

#### Description

Sometimes it's easier to create an object that needs to follow certain type rules in typescript and then export it to a JSON object. How to do this though?

This method wraps the JSON object you create (statically and not dynamically) and will output to the provided `filePath` at build time.

#### Examples

```ts
import { writeJson } from 'json.macro';

type Config = {config: boolean, type: 'string' | 'array' };
const json = writeJson<Config>({config: true, type: 'array'}, './config.json);

```

↓ ↓ ↓ ↓ ↓ ↓

```js
const json = { config: true, type: 'array' };
```

And `./config.json` is written as.

```json
{
  "config": true,
  "type": "array"
}
```

One thing to be aware of is that this method only supports inline or statically inferable values. You can't use any dynamic values, like return values from a function call.

```ts
import { writeJson } from 'json.macro';

const json = { custom: 'custom' };
const createJson = () => json;

writeJson({ a: true }, './file.json'); // Static ✅
writeJson(custom, './file.json'); // Static ✅

writeJson(createJson(), './file.json'); // Dynamic ❌
```

<br />

### `json.macro/types`

You might find yourself wanting to use the `PackageJson` or `TsConfigJson` types in your own code. For this reason this file re-exports them from `type-fest` to save you the hassle of adding another direct dependency.

```ts
import { PackageJson, TsConfigJson } from 'json.macro/types';

let pkg: PackageJson;
let tsconfig: TsConfigJson;
```

There is also a `SemanticVersion` interface which exported by the same file. This is the return type for the `getVersion(true)` function call.

```ts
import { SemanticVersion } from 'json.macro/types';

let version: SemanticVersion;
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
