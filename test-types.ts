/* eslint-disable @typescript-eslint/no-unused-vars-experimental */
import { loadJson, writeJson } from './';

const json1: { type: 'awesome' } = loadJson('package.json');

// @ts-expect-error
const fail1: { type: 'awesome' } = loadJson<string>('');

const json2: { a: number; b: string } = writeJson(
  {
    a: 1,
    b: 'string',
  },
  './custom-json',
);

// @ts-expect-error
const fail2: { a: number; b: string } = writeJson(
  {
    a: 1,
  },
  './custom-json',
);
