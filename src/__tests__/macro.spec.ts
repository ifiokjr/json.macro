import plugin from 'babel-plugin-macros';
import pluginTester from 'babel-plugin-tester';
import { join } from 'path';

const macroPath = join(__dirname, '../macro.js');

pluginTester({
  plugin,
  pluginName: 'json.macro',
  title: 'loadTsConfigJson',
  snapshot: true,
  babelOptions: {
    filename: join(__dirname, '__fixtures__', 'file.js'),
  },

  tests: {
    'run correctly': {
      code: `import { loadTsConfigJson } from '../../macro.js';
      const packageJson = loadTsConfigJson();`,
      snapshot: true,
    },
    'get different name': {
      code: `import { loadTsConfigJson } from '../../macro.js';
      const name = loadTsConfigJson('tsconfig.awesome.json');
      `,
    },
    'get invalid name': {
      code: `import { loadTsConfigJson } from '../../macro.js';
      const name = loadTsConfigJson('tsconfig.not.real.json');
      `,
      snapshot: false,
      error:
        "No 'tsconfig.not.real.json' file could be loaded from your current file.",
    },
    'invalid argument': {
      code: `import { loadTsConfigJson } from '../../macro.js';
      const loadedFile = loadTsConfigJson(['invalid']);`,
      error: 'Invalid argument passed to method.',
      snapshot: false,
    },
    'too many arguments': {
      code: `import { loadTsConfigJson } from '../../macro.js';
      const loadedFile = loadTsConfigJson('value', 'name');`,
      error: 'Too many arguments provided to the function call:',
      snapshot: false,
    },
  },
});

pluginTester({
  plugin,
  pluginName: 'json.macro',
  title: 'loadPackageJson',
  snapshot: true,
  babelOptions: {
    filename: join(__dirname, '__fixtures__', 'file.js'),
  },

  tests: {
    'run correctly': {
      code: `import { loadPackageJson } from '../../macro.js';
      const packageJson = loadPackageJson();`,
      snapshot: true,
    },
    'get key': {
      code: `import { loadPackageJson } from '../../macro.js';
      const name = loadPackageJson('name');
      const notReal = loadPackageJson('not real');
      `,
    },
    'no package.json': {
      babelOptions: {
        filename: '/asdf/asdf/asdf',
      },
      code: `import { loadPackageJson } from '${macroPath}';
      const notReal = loadPackageJson();
      `,
      error:
        "No package.json file could be loaded from your current directory. '/asdf/asdf'",
      snapshot: false,
    },
    'invalid argument': {
      code: `import { loadPackageJson } from '../../macro.js';
      const loadedFile = loadPackageJson(['invalid']);`,
      error: 'Invalid argument passed to method.',
      snapshot: false,
    },
    'too many arguments': {
      code: `import { loadPackageJson } from '../../macro.js';
      const loadedFile = loadPackageJson('value', 'name');`,
      error: 'Too many arguments provided to the function call:',
      snapshot: false,
    },
  },
});

pluginTester({
  plugin,
  pluginName: 'json.macro',
  title: 'no filename',
  snapshot: true,
  babelOptions: {
    filename: undefined,
  },
  tests: {
    'no filename': {
      code: `import { loadJson } from '${macroPath}';

      const loadedFile = loadJson('./__fixtures__/one.test.json');`,
      error:
        'json.macro methods can only be used on files and no filename was found',
      snapshot: false,
    },
  },
});

pluginTester({
  plugin,
  pluginName: 'json.macro',
  title: 'loadJson',
  snapshot: true,
  babelOptions: {
    filename: __filename,
  },

  tests: {
    'run correctly': {
      code: `import { loadJson } from '../macro.js';

      const loadedFile = loadJson('./__fixtures__/one.test.json');`,
    },
    'use property': {
      code: `import { loadJson } from '../macro.js';

      const loadedFile = loadJson('./__fixtures__/one.test.json').simple;`,
    },
    'no argument': {
      code: `import { loadJson } from '../macro.js';
        const loadedFile = loadJson();`,
      error: 'No arguments were provided when one is required: loadJson()',
      snapshot: false,
    },
    'not called': {
      code: `import { loadJson } from '../macro.js';
        const loadedFile = loadJson;`,
      error:
        "'loadJson' called from 'json.macro' must be used as a function call",
      snapshot: false,
    },
    'file does not exist': {
      code: `import { loadJson } from '../macro.js';
      const loadedFile = loadJson('./file-does-not-exist.json');`,
      error: "The provided path: './file-does-not-exist.json' does not exist",
      snapshot: false,
    },
    'pseudo-dynamic values': {
      code: `import { loadJson } from '../macro.js';
      const fileName = './__fixtures__/one.test' + '.json';
      const loadedFile = loadJson(fileName);`,
      // error: "The provided path: './file-does-not-exist.json' does not exist",
      // snapshot: false,
    },
    'dynamic values': {
      code: `import { loadJson } from '../macro.js';
      const fileName = () => './__fixtures__/one.test' + '.json';
      const loadedFile = loadJson(fileName());`,
      error: 'Invalid argument passed to method.',
      snapshot: false,
    },
    'invalid json': {
      code: `import { loadJson } from '../macro.js';
      const loadedFile = loadJson('./__fixtures__/invalid.json');`,
      error: 'There was a problem loading the provided JSON file:',
      snapshot: false,
    },
    'invalid argument': {
      code: `import { loadJson } from '../macro.js';
        const loadedFile = loadJson(['invalid']);`,
      error: 'Invalid argument passed to method.',
      snapshot: false,
    },
    'too many arguments': {
      code: `import { loadJson } from '../macro.js';
        const loadedFile = loadJson('./__fixtures__/one.test.json', './__fixtures__/two.test.json');`,
      error: 'Too many arguments provided to the function call:',
      snapshot: false,
    },
  },
});

pluginTester({
  plugin,
  pluginName: 'json.macro',
  title: 'loadJsonFiles',
  snapshot: true,
  babelOptions: {
    filename: __filename,
  },

  tests: {
    'run correctly': {
      code: `import { loadJsonFiles } from '../macro.js';
      const loadedFiles = loadJsonFiles('__fixtures__/*.test.json', '**/four.json');
     `,
    },
    'no argument': {
      code: `import { loadJsonFiles } from '../macro.js';
      const loadedFiles = loadJsonFiles();
     `,
      snapshot: false,
      error:
        'You must provide at least one file pattern string to the function call',
    },
    'invalid argument': {
      code: `import { loadJsonFiles } from '../macro.js';
      const loadedFiles = loadJsonFiles('__fixtures__/*.test.json', '**/four.json', false, []);
     `,
      snapshot: false,
      error:
        "Invalid argument passed to method. Expected 'string' but received 'boolean'.",
    },
    'globs without files should error': {
      code: `import { loadJsonFiles } from '../macro.js';
      const loadedFiles = loadJsonFiles('__fixtures__/*.test.fake', '**/four.woah');
     `,
      snapshot: false,
      error: "The file patterns provided didn't match any files:",
    },
  },
});

pluginTester({
  plugin,
  pluginName: 'json.macro',
  title: 'getVersion',
  snapshot: true,
  babelOptions: {
    filename: join(__dirname, '__fixtures__', 'file.js'),
  },

  tests: {
    'run correctly': {
      code: `import { getVersion } from '../../macro.js';
      const version = getVersion();
      const versionAlt = getVersion(false);
      const versionObject = getVersion(true);
      `,
      snapshot: true,
    },
    'no package.json': {
      babelOptions: {
        filename: '/asdf/asdf/asdf',
      },
      code: `import { getVersion } from '${macroPath}';
      const version = getVersion();
      `,
      error:
        "No package.json file could be loaded from your current directory. '/asdf/asdf'",
      snapshot: false,
    },
    'no version': {
      code: `import { getVersion } from '${macroPath}';
      const version = getVersion();`,
      error: 'No version found for the resolved `package.json` file.',
      snapshot: false,
      babelOptions: {
        filename: join(__dirname, '__fixtures__', 'no-version', 'file.js'),
      },
    },
    'invalid version': {
      code: `import { getVersion } from '${macroPath}';
      const version = getVersion(true);`,
      error:
        "A semantic versioning object could not be parsed from the invalid string: 'invalid sever version'",
      snapshot: false,
      babelOptions: {
        filename: join(__dirname, '__fixtures__', 'invalid-version', 'file.js'),
      },
    },
    'invalid version string': {
      code: `import { getVersion } from '${macroPath}';
      const version = getVersion(false);`,
      error:
        "A semantic versioning object could not be parsed from the invalid string: 'invalid sever version'",
      snapshot: false,
      babelOptions: {
        filename: join(__dirname, '__fixtures__', 'invalid-version', 'file.js'),
      },
    },
  },
});
