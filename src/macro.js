import { parseExpression } from '@babel/parser';
import { createMacro, MacroError } from 'babel-plugin-macros';
import { readFileSync } from 'fs';
import glob from 'globby';
import JSON from 'json5';
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
 * Evaluates the string value and throws if not found.
 *
 * @param {Object} options
 * @param {NodePath | undefined} options.node
 * @param {NodePath} options.parentPath
 * @param {boolean} [options.allowUndefined]
 *
 * @returns {string}
 */
function evaluateStringNodeValue({ parentPath, node, allowUndefined = false }) {
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

  const undefinedValueIsAllowed = allowUndefined && value === undefined;

  if (typeof value !== 'string' && !undefinedValueIsAllowed) {
    frameError(
      parentPath,
      `Invalid argument passed to method. Expected 'string' but received '${typeof value}'.`,
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
 * @param {boolean} [options.required] - whether the argument must be provided
 * @default true
 *
 * @returns {NodePath | undefined}
 */
function getFirstArgumentNode({ parentPath, required = true }) {
  const nodes = parentPath.get('arguments');
  const nodeArray = Array.isArray(nodes) ? nodes : [nodes];

  if (nodeArray.length > 1) {
    frameError(
      parentPath,
      `Too many arguments provided to the function call: ${parentPath.getSource()}. This method only supports one or less.`,
    );
  }

  const node = nodeArray?.[0];

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
    jsonValue = JSON.parse(fileContent);
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
 * @param {import('@babel/core').PluginPass} options.state
 */
function replaceParentExpression(options) {
  const { babel, parentPath, value, state } = options;

  const expression = babel.types.parenthesizedExpression(
    parseExpression(
      `${state.file.scope.generateUidIdentifier().name} = ${JSON.stringify(
        value,
      )}`,
      {},
    ),
  );

  parentPath.replaceWith(expression);
}

/**
 * Loads the version from the nearest package.json file.
 *
 * @param { MethodParams } options
 */
function getVersion({ reference, state, babel }) {
  const filename = getFileName(state);

  const { parentPath } = reference;
  const cwd = dirname(filename);

  const node = getFirstArgumentNode({ parentPath, required: false });
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

  replaceParentExpression({ babel, parentPath, value, state });
}

/**
 * Loads the nearest package.json file.
 *
 * @param { MethodParams } options
 */
function loadPackageJson({ reference, state, babel }) {
  const filename = getFileName(state);

  const { parentPath } = reference;
  const cwd = dirname(filename);

  const node = getFirstArgumentNode({ parentPath, required: false });
  const key = node
    ? evaluateStringNodeValue({
        node,
        parentPath,
        allowUndefined: true,
      })
    : undefined;

  const jsonValue = loadAndParsePackageJsonFile({ cwd, parentPath });
  const value = key ? jsonValue[key] ?? null : jsonValue;

  replaceParentExpression({ babel, parentPath, value, state });
}

/**
 * Loads the nearest package.json file.
 *
 * @param { MethodParams } options
 */
function loadTsConfigJson({ reference, state, babel }) {
  const filename = getFileName(state);

  const { parentPath } = reference;
  const cwd = dirname(filename);

  const node = getFirstArgumentNode({ parentPath, required: false });
  const searchName = node
    ? evaluateStringNodeValue({
        node,
        parentPath,
        allowUndefined: true,
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

  replaceParentExpression({ babel, parentPath, state, value: result.config });
}

/**
 * Handles loading a single json file.
 *
 * @param { MethodParams } options
 */
function loadJson({ reference, state, babel }) {
  const filename = getFileName(state);

  const { parentPath } = reference;
  const dir = dirname(filename);

  const node = getFirstArgumentNode({ parentPath, required: true });
  const rawPath = evaluateStringNodeValue({
    node,
    parentPath,
  });

  /** @type {string} */
  let filePath;
  try {
    filePath = require.resolve(rawPath, { paths: [dir] });
  } catch {
    frameError(parentPath, `The provided path: '${rawPath}' does not exist`);
  }
  const value = loadAndParseJsonFile({ filePath, parentPath });

  replaceParentExpression({ babel, parentPath, value, state });
}

/**
 * Handles loading multiple json files by their glob pattern.
 *
 * @param { MethodParams } options
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
    return evaluateStringNodeValue({
      node,
      parentPath,
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

  replaceParentExpression({ babel, parentPath, value, state });
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
