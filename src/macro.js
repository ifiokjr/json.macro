import { parseExpression } from '@babel/parser';
import is from '@sindresorhus/is';
import { createMacro, MacroError } from 'babel-plugin-macros';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import glob from 'globby';
import JSON5 from 'json5';
import get from 'lodash.get';
import { dirname, resolve } from 'path';
import findPackageJson from 'pkg-up';
import { parse } from 'semver';
import {
  CacheStrategy,
  DEFAULT_SEARCH_NAME,
  tsconfigResolverSync,
} from 'tsconfig-resolver';

/**
 * @typedef { import('babel-plugin-macros').MacroParams } MacroParams
 * @typedef { import('@babel/core').Node } Node
 * @typedef { import('@babel/core').NodePath<Node> } NodePath
 * @typedef {{ reference: NodePath, babel: MacroParams['babel'], state:
 * MacroParams['state'] }} MethodParams
 * @typedef { (options: MethodParams) => void } MethodCall

 * @typedef {Object} CheckReferenceExistsParameter
 * @property {string} name - The reference name to check for
 * @property {MethodCall} method - the method called for each instance of the
 * reference.
 * @property {MacroParams} macroParameter - the reference to check.
 */

/**
 * Provides a custom error for this macro.
 */
class JsonMacroError extends MacroError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'JsonMacroError';
    this.stack = '';
  }
}

/**
 * Checks if a value is a string or is undefined.
 *
 * @param {unknown} value
 * @returns {value is string}
 */
function isStringOrUndefined(value) {
  return is.string(value) || is.undefined(value);
}

/**
 * Check whether the directory structure for a file path exists, and create it
 * if it doesn't.
 *
 * @param {string} filePath
 *
 * @returns {void}
 */
function ensureDirectoryExists(filePath) {
  const dir = dirname(filePath);

  if (existsSync(dir)) {
    return;
  }

  ensureDirectoryExists(dir);
  mkdirSync(dir);
}

/**
 * Prints readable error messages for when loading a json file fails.
 * @param {NodePath} path
 * @param {string} message
 *
 * @returns {never}
 */
function frameError(path, message) {
  throw path.buildCodeFrameError(`\n\n${message}\n\n`, JsonMacroError);
}

/**
 * Evaluates the value matches the provided `predicate`.
 * @template Type

 * @param {Object} options
 * @param {NodePath | undefined} options.node
 * @param {NodePath} options.parentPath
 * @param {(value: unknown) => value is Type } options.predicate
 *
 * @returns {Type}
 */
function evaluateNodeValue({ parentPath, node, predicate }) {
  let value;
  try {
    value = node?.evaluate().value;
  } catch {
    /* istanbul ignore next */
    frameError(
      parentPath,
      `There was a problem evaluating the value of the argument for the code: ${parentPath.getSource()}. If the value is dynamic, please make sure that its value is statically deterministic.`,
    );
  }

  if (!predicate(value)) {
    frameError(
      parentPath,
      `Invalid argument passed to function call. Received unsupported type '${is(
        value,
      )}'.`,
    );
  }

  return value;
}

/**
 * Get the node for the first argument of a function call. Will throw an error
 * if more than one argument.
 *
 * @param {Object} options
 * @param {NodePath} options.parentPath
 * @param {boolean} [options.required=true] - whether the argument must be provided
 * @param {number} [options.index=0] - the argument index to get
 * @param {number} [options.maxArguments=1] - maximum number of arguments accepted
 *
 * @returns {NodePath | undefined}
 */
function getArgumentNode({
  parentPath,
  required = true,
  index = 0,
  maxArguments = 1,
}) {
  const nodes = parentPath.get('arguments');
  const nodeArray = Array.isArray(nodes) ? nodes : [nodes];

  if (nodeArray.length > maxArguments) {
    frameError(
      parentPath,
      `Too many arguments provided to the function call: ${parentPath.getSource()}. This method only supports one or less.`,
    );
  }

  const node = nodeArray?.[index];

  if (node === undefined && required) {
    frameError(
      parentPath,
      `No arguments were provided when one is required: ${parentPath.getSource()}.`,
    );
  }

  return node;
}

/**
 * Loads a file, parses it's as a json string and throws an error if there is
 * problem doing do.
 *
 * @template Type
 *
 * @param {Object} options
 * @param {string} options.filePath
 * @param {NodePath} options.parentPath
 *
 * @returns {Type}
 */
function loadAndParseJsonFile({ filePath, parentPath }) {
  let jsonValue;

  try {
    const fileContent = readFileSync(filePath, { encoding: 'utf-8' });
    jsonValue = JSON5.parse(fileContent);
  } catch {
    frameError(
      parentPath,
      `There was a problem loading the provided JSON file: '${filePath}'. Please make sure the file exists and you have provided valid JSON content.`,
    );
  }

  return jsonValue;
}

/**
 * @param {any} state
 *
 * @returns {string}
 */
function getFileName(state) {
  const fileName = state.file.opts.filename;

  if (!fileName) {
    throw new JsonMacroError(
      'json.macro methods can only be used on files and no filename was found',
    );
  }

  return fileName;
}

/**
 * Loads the nearest `package.json` file throws an error if there is
 * problem doing do.
 *
 * @param {Object} options
 * @param {string} options.cwd - the current working directory
 * @param {NodePath} options.parentPath
 *
 * @returns {import('type-fest').PackageJson}
 */
function loadAndParsePackageJsonFile(options) {
  const { cwd, parentPath } = options;
  const filePath = findPackageJson.sync({ cwd });

  if (!filePath) {
    frameError(
      parentPath,
      `No package.json file could be loaded from your current directory. '${cwd}'`,
    );
  }

  return loadAndParseJsonFile({ filePath, parentPath });
}

/**
 * @param {Object} options
 * @param {unknown} options.value
 * @param {MacroParams['babel']} options.babel - the babel object
 * @param {NodePath} options.parentPath
 */
function replaceParentExpression(options) {
  const { babel, parentPath, value } = options;

  const expression = babel.types.parenthesizedExpression(
    parseExpression(`[${JSON.stringify(value)}][0]`, {}),
  );

  parentPath.replaceWith(expression);
}

/**
 * Loads the version from the nearest package.json file.
 *
 * @param {MethodParams} options
 */
function getVersion({ reference, state, babel }) {
  const filename = getFileName(state);

  const { parentPath } = reference;
  const cwd = dirname(filename);

  const node = getArgumentNode({ parentPath, required: false });
  const shouldLoadObject = node && node?.evaluate().value === true;

  const jsonValue = loadAndParsePackageJsonFile({ cwd, parentPath });
  const stringVersion = jsonValue.version;

  if (!stringVersion) {
    frameError(
      parentPath,
      'No version found for the resolved `package.json` file.',
    );
  }

  /** @type {string | import('../types').SemanticVersion} */
  let value = stringVersion;

  /** @type {import('../types').SemanticVersion | null} */

  const semver = parse(stringVersion);
  if (!semver) {
    frameError(
      parentPath,
      `A semantic versioning object could not be parsed from the invalid string: '${stringVersion}'`,
    );
  }

  if (shouldLoadObject) {
    value = {
      build: semver.build,
      loose: semver.loose,
      major: semver.major,
      minor: semver.minor,
      patch: semver.patch,
      prerelease: semver.prerelease,
      raw: semver.raw,
      version: semver.version,
    };
  }

  replaceParentExpression({ babel, parentPath, value });
}

/**
 * Loads the nearest package.json file.
 *
 * @param {MethodParams} options
 */
function loadPackageJson({ reference, state, babel }) {
  const filename = getFileName(state);

  const { parentPath } = reference;
  const cwd = dirname(filename);

  const node = getArgumentNode({ parentPath, required: false });
  const key = node
    ? evaluateNodeValue({
        node,
        parentPath,
        predicate: isStringOrUndefined,
      })
    : undefined;

  const jsonValue = loadAndParsePackageJsonFile({ cwd, parentPath });
  const value = key ? jsonValue[key] ?? null : jsonValue;

  replaceParentExpression({ babel, parentPath, value });
}

/**
 * Loads the nearest package.json file.
 *
 * @param {MethodParams} options
 */
function loadTsConfigJson({ reference, state, babel }) {
  const filename = getFileName(state);

  const { parentPath } = reference;
  const cwd = dirname(filename);

  const node = getArgumentNode({ parentPath, required: false });
  const searchName = node
    ? evaluateNodeValue({
        node,
        parentPath,
        predicate: isStringOrUndefined,
      })
    : DEFAULT_SEARCH_NAME;

  const result = tsconfigResolverSync({
    cwd,
    cache: CacheStrategy.Directory,
    searchName,
  });

  if (!result.exists) {
    frameError(
      parentPath,
      `No '${searchName}' file could be loaded from your current file. ${filename}`,
    );
  }

  replaceParentExpression({ babel, parentPath, value: result.config });
}

/**
 * Handles writing a single json file with an optional object path parameter.
 *
 * @param {MethodParams} options
 */
function writeJson({ reference, state, babel }) {
  const filename = getFileName(state);

  const { parentPath } = reference;
  const dir = dirname(filename);

  const json = evaluateNodeValue({
    node: getArgumentNode({
      parentPath,
      required: true,
      maxArguments: 2,
      index: 0,
    }),
    parentPath,
    predicate: is.plainObject,
  });

  const relativeFilePath = evaluateNodeValue({
    node: getArgumentNode({
      parentPath,
      required: true,
      maxArguments: 2,
      index: 1,
    }),
    parentPath,
    predicate: is.string,
  });

  const filePath = resolve(dir, relativeFilePath);

  // Make sure the file path exists.
  ensureDirectoryExists(filePath);

  // Write to the provided filePath.
  writeFileSync(filePath, JSON.stringify(json, null, 2), { encoding: 'utf8' });

  replaceParentExpression({ babel, parentPath, value: json });
}

/**
 * Handles loading a single json file with an optional object path parameter.
 *
 * @param {MethodParams} options
 */
function loadJson({ reference, state, babel }) {
  const filename = getFileName(state);

  const { parentPath } = reference;
  const dir = dirname(filename);

  const rawFilePath = evaluateNodeValue({
    node: getArgumentNode({
      parentPath,
      required: true,
      maxArguments: 2,
      index: 0,
    }),
    parentPath,
    predicate: is.string,
  });

  const path = evaluateNodeValue({
    node: getArgumentNode({
      parentPath,
      required: false,
      maxArguments: 2,
      index: 1,
    }),
    parentPath,
    predicate: isStringOrUndefined,
  });

  /** @type {string} */
  let filePath;

  try {
    filePath = require.resolve(rawFilePath, { paths: [dir] });
  } catch {
    frameError(
      parentPath,
      `The provided path: '${rawFilePath}' does not exist`,
    );
  }

  const jsonValue = loadAndParseJsonFile({ filePath, parentPath });
  const value = path ? get(jsonValue, path) : jsonValue;

  replaceParentExpression({ babel, parentPath, value });
}

/**
 * Handles loading multiple json files by their glob pattern.
 *
 * @param {MethodParams} options
 */
function loadJsonFiles({ reference, state, babel }) {
  const filename = getFileName(state);

  const { parentPath } = reference;
  const callExpressionPath = reference.parentPath;
  const dir = dirname(filename);

  const args = callExpressionPath.get('arguments');
  const argsArray = Array.isArray(args) ? args : [args];

  if (argsArray.length === 0) {
    frameError(
      parentPath,
      `You must provide at least one file pattern string to the function call: '${parentPath.getSource()}'. If the value is dynamic, please make sure that its value is statically deterministic.`,
    );
  }

  const globs = argsArray.map((node) => {
    return evaluateNodeValue({
      node,
      parentPath,
      predicate: is.string,
    });
  });

  const files = glob.sync(globs, { cwd: dir });

  if (files.length === 0) {
    frameError(
      parentPath,
      `The file patterns provided didn't match any files: '${parentPath.getSource()}'. If the value is dynamic, please make sure that its value is statically deterministic.`,
    );
  }

  const value = files.map((relativePath) =>
    loadAndParseJsonFile({ filePath: resolve(dir, relativePath), parentPath }),
  );

  replaceParentExpression({ babel, parentPath, value });
}

/**
 * Check to see if the provided reference name is used in this file. When it's
 * available call the function for every occurrence.
 *
 * @param {CheckReferenceExistsParameter} options
 *
 * @returns {void}
 */
function checkReferenceExists(options) {
  const { method, name, macroParameter } = options;
  const { babel, references, state } = macroParameter;
  const namedReferences = references[name];

  if (!namedReferences) {
    return;
  }

  for (const reference of namedReferences) {
    const { parentPath } = reference;

    if (!parentPath.isCallExpression()) {
      throw frameError(
        parentPath,
        `'${name}' called from 'json.macro' must be used as a function call.`,
      );
    }

    method({ babel, reference, state });
  }
}

/** The supported methods for this macro */
const supportedMethods = [
  { name: 'writeJson', method: writeJson },
  { name: 'loadJson', method: loadJson },
  { name: 'loadJsonFiles', method: loadJsonFiles },
  { name: 'getVersion', method: getVersion },
  { name: 'loadPackageJson', method: loadPackageJson },
  { name: 'loadTsConfigJson', method: loadTsConfigJson },
];

/**
 * The macro which is created and exported for usage in your project.
 */
export default createMacro((macroParameter) => {
  for (const supportedMethod of supportedMethods) {
    const { name, method } = supportedMethod;
    checkReferenceExists({ name, method, macroParameter });
  }
});
