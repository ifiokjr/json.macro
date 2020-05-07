import { PackageJson, TsConfigJson } from 'type-fest';

/**
 * This loads a json file from the provided path. The path can be relative to
 * the file it's being used from, an absolute path, or a path to your
 * `node_modules` folder.
 *
 * If the file can't be resolved the build will fail.
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
 */
export function loadJson(filePath: string): any;

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
export function loadJsonFiles(glob: string, ...globs: string[]): any[];

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
