/**
 * Prettier configuration.
 *
 * Formatting is checked in CI (`npm run format:check`) so that diffs stay
 * readable and reviews stay about behaviour rather than whitespace.
 */
const config = {
  printWidth: 100,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  overrides: [
    {
      files: ['*.md'],
      options: {
        proseWrap: 'preserve',
      },
    },
  ],
};

export default config;
