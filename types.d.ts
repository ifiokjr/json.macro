export { PackageJson, TsConfigJson } from 'type-fest';

export interface SemanticVersion {
  /**
   * The raw un-parsed version taken directly from your `package.json` file. This
   * includes the build numbers.
   */
  raw: string;

  /**
   * Whether this version is loose or not.
   */
  loose: boolean;

  /**
   * The major version.
   *
   * `3.4.1-alpha.100+a.123` => `3`
   */
  major: number;

  /**
   * The minor version.
   *
   * `3.4.1-alpha.100+a.123` => `4`
   */
  minor: number;

  /**
   * The patch version.
   *
   * `3.4.1-alpha.100+a.123` => `1`
   */
  patch: number;

  /**
   * The version as a string without the build number.
   */
  version: string;

  /**
   * The build number for this version
   *
   * `3.4.1-alpha.100+a.123` => `['a', 123]`
   */
  build: readonly string[];

  /**
   * The prerelease string.
   *
   * `3.4.1-alpha.100+a.123` => `['alpha', 100]`
   */
  prerelease: ReadonlyArray<string | number>;
}
