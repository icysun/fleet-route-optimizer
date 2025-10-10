const { ESLint } = require('eslint');

module.exports = [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: require('@typescript-eslint/parser'),
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': 'off',
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'docs/**',
      'debug/**',
      'spec/**',
      'build/**',
    ],
  },
];
			'docs/examples/geojson/sample-geojson.js',
			'docs/examples/map-panes/eu-countries.js',
			'docs/examples/extending-2-layers/index.md',
			'docs/examples/quick-start/index.md', // importmap is not recognized by eslint
			'docs/download.md', // importmap is not recognized by eslint
			'docs/_posts/2025-05-18-leaflet-2.0.0-alpha.md', // importmap is not recognized by eslint
			'docs/_posts/201*',
			'docs/_site',
			'coverage'
		]
	},
	{
		plugins: {
			import: importPlugin
		},
		rules: {
			'dot-notation': 'off',
			'consistent-return': 'off',
			'curly': 'error',
			'no-unused-expressions': ['error', {allowShortCircuit: true}],
			'no-unused-vars': ['error', {caughtErrors: 'none'}],

			'import/extensions': ['error', 'ignorePackages'],

			'@stylistic/indent': ['error', 'tab', {VariableDeclarator: 0, flatTernaryExpressions: true}],
			'@stylistic/no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
			'@stylistic/key-spacing': 'off',
			'@stylistic/linebreak-style': ['off', 'unix'],
			'@stylistic/spaced-comment': 'error',

			// TODO: Re-enable the rules below and fix the linting issues.
			'no-invalid-this': 'off',
			'prefer-exponentiation-operator': 'error',
			'prefer-object-has-own': 'error',
			'prefer-spread': 'off',
			'no-new': 'off'
		}
	},
	{
		files: ['docs/examples/**', 'docs/plugins.md'],
		rules: {
			'@stylistic/eol-last': 'off',
		},
	},
	{
		files: ['spec/**'],
		languageOptions: {
			globals: {...globals.mocha}
		},
		rules: {
			'no-unused-expressions': 'off'
		}
	},
	{
		files: ['build/**'],
		languageOptions: {
			parserOptions: {
				ecmaVersion: 2022
			}
		}
	},
	{
		files: ['docs/**/*.md'],
		plugins: {
			scriptTags: {
				processors: {md: scriptTags.processors['.md']}
			}
		},
		processor: 'scriptTags/md',
		rules: {
			'no-unused-vars': 'off',
			'@stylistic/js/eol-last': 'off'
		},
		languageOptions: {
			globals: {L: false}
		}
	}
];
