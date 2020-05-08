import { PackageJson, SemanticVersion, TsConfigJson } from './types';

/**
 * This loads a json file from the provided path. The path can be relative to
 * the file it's being used from, an absolute path, or a path to your
 * `node_modules` folder.
 *
 * If the file can't be resolved the build will fail.
 *
 * @remarks
 *
 * For the following json file: `./my-json.json`
 *
 * ```json
 * {
 *   "custom": 1,
 * }
 * ```
 *
 * This is how to load it at build time.
 *
 * @example
 *
 * ```js
 * import { loadJson } from 'json.macro';
 *
 * const myJson = loadJson('my-json.json');
 * ```
 *
 * Compiles to ↓ ↓ ↓ ↓ ↓ ↓
 *
 * ```js
 * const myJson = { custom: 1 };
 * ```
 *
 * Magic :-)
 *
 * To load from node_modules you can do something like the following.
 *
 * ```js
 * import { loadJson } from 'json.macro';
 *
 * const jsonFromNode = loadJson('json.macro/package.json');
 * ```
 *
 * The above will be replaced with the full package.json file from the
 * json.macro node_modules package.
 *
 * If you are using typescript you can specify the expected return type by
 * annotating the variable created.
 *
 * @example
 *
 * ```ts
 * import { loadJson } from 'json.macro';
 *
 * const myJson: { custom: number } = loadJson('my-json.json');
 * ```
 *
 * If a second parameter is passed, this can also load a specific key path from
 * a json file.
 *
 * @example
 *
 * `./my-json.json`
 *
 * ```json
 * {
 *   "a": {
 *     "b": { "c": { "d": 1 } },
 *     "arr": [1, 2, 3, 4, { "end" : true }]
 *   }
 * }
 * ```
 *
 * ```js
 * import { loadJsonPath } from 'json.macro';
 *
 * const value = loadJsonPath('my-json.json', 'a.b.c.d')
 * const value2 = loadJsonPath('my-json.json', 'a.arr.4.end')
 * ```
 *
 * Compiles to
 * ↓ ↓ ↓ ↓ ↓ ↓
 *
 * ```js
 * const value = 1;
 * const value2 = true;
 * ```
 */
export function loadJson<Type>(filePath: string, path?: string): Type;

/**
 * Write a json object to a relative file path.
 *
 * @remarks
 *
 * Sometimes it's easier to create an object that needs to follow certain type
 * rules in typescript and then export it to a json object. How to do this
 * though?
 *
 * This method wraps the json object you create (statically and not dynamically)
 * and will output to the provided filePath at build time.
 *
 * @example
 *
 * ```ts
 * import { writeJson } from 'json.macro';
 *
 * type Config = {config: boolean, type: 'string' | 'array' };
 * const json = writeJson<Config>({config: true, type: 'array'}, './config.json);
 * ```
 *
 * Compiles to
 * ↓ ↓ ↓ ↓ ↓ ↓
 *
 * ```js
 * const json = { config: true, type: 'array' }
 * ```
 *
 * And `./config.json` is written as.
 *
 * ```json
 * {
 *   "config": true,
 *   "type": "array"
 * }
 * ```
 *
 * One thing to be aware of is that this method only supports inline or
 * statically inferrable values. You can't use any dynamic values, like return
 * values from a function call.
 *
 * ```ts
 * import { writeJson } from 'json.macro';
 *
 * const json = { custom: 'custom' };
 * const createJson = () => json;
 *
 * writeJson({ a: true }, './file.json'); // Static ✅
 * writeJson(custom, './file.json'); // Static ✅
 *
 * writeJson(createJson(), './file.json'); // Dynamic ❌
 * ```
 */
export function writeJson<Type>(json: Type, filePath: string): Type;

/**
 * Load all the json files matching the provided glob patterns. If no files
 * match then an empty array is returned.
 *
 * @example
 *
 * ```js
 * import { loadJsonFiles } from 'json.macro';
 *
 * const jsonArray = loadJsonFiles('*.json');
 * ```
 *
 * Compiles to
 * ↓ ↓ ↓ ↓ ↓ ↓
 *
 * ```js
 * const jsonArray = [{ custom: 1}, {another: 2}];
 * ```
 *
 * If you are using typescript you can specify the expected return type by
 * annotating the variable created.
 *
 * ```ts
 * import { loadJsonFiles } from 'json.macro';
 *
 * const jsonArray: Array<{ custom: string}> = loadJsonFiles('*.json');
 * ```
 */
export function loadJsonFiles<Type>(glob: string, ...globs: string[]): Type[];

/**
 * Load the nearest parent `package.json` file.
 *
 * You can also provide a key property which will load the property
 * corresponding to the key from the nearest `package.json`.
 *
 * @example
 *
 * ```js
 * import { loadPackageJson } from 'json.macro';
 *
 * const packageJson = loadPackageJson();
 * const name = loadPackageJson('name');
 * ```
 *
 * Compiles to
 * ↓ ↓ ↓ ↓ ↓ ↓
 *
 * ```js
 * const packageJson = { name: 'my-package', version: '1.0.0', private: true };
 * const name = '1.0.0';
 * ```
 *
 * For typescript users, the types are automatically inferred using the
 * `PackageJson` type from the
 * [`type-fest`](https://github.com/sindresorhus/type-fest) library.
 */
export function loadPackageJson(): PackageJson;
export function loadPackageJson<Key extends string>(key: Key): PackageJson[Key];

/**
 * Load the nearest parent `tsconfig.json` file.
 *
 * You can customise the name of the file searched for.
 *
 * @example
 *
 * ```js
 * import { loadTsConfigJson } from 'json.macro';
 *
 * const tsconfig = loadTsConfigJson();
 * const customTsConfig = loadTsConfigJson('tsconfig.custom.json');
 * ```
 *
 * Compiles to
 * ↓ ↓ ↓ ↓ ↓ ↓
 *
 * ```js
 * const tsconfig = { compilerOptions: {} };
 * const customTsConfig = { compilerOptions: { paths: [] } };
 * ```
 *
 * For typescript users, the types are automatically inferred using the
 * `TsConfigJson` type from the
 * [`type-fest`](https://github.com/sindresorhus/type-fest) library.
 */
export function loadTsConfigJson(): TsConfigJson;
export function loadTsConfigJson(fileName: string): TsConfigJson;

/**
 * Get the semver compatible version from the package.json file.
 *
 * This will throw a built error if the semver version in your package.json is
 * not valid.
 *
 * @example
 *
 * ```js
 * import { getVersion } from 'json.macro';
 *
 * const versionString = getVersion();
 * const versionStringAlt = getVersion(false);
 * const versionObject = getVersion(true);
 * ```
 *
 * Compiles to
 * ↓ ↓ ↓ ↓ ↓ ↓
 *
 * ```js
 * const versionString = '1.19.2';
 * const versionStringAlt = '1.19.2';
 * const versionObject = { major: 1, minor: 19, patch: 2, version: '1.19.2' }
 * ```
 */
export function getVersion(verbose?: false): string;
export function getVersion(verbose: true): SemanticVersion;
