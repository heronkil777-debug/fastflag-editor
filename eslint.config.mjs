export default [
  { ignores: ['dist/', 'release/', 'node_modules/', '*.config.*', '*.lock'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: ['./tsconfig.json', './tsconfig.main.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: { react: { version: '19.2' } },
    plugins: {
      react: await import('eslint-plugin-react'),
      'react-hooks': await import('eslint-plugin-react-hooks'),
      '@typescript-eslint': await import('typescript-eslint'),
      prettier: await import('eslint-plugin-prettier'),
    },
    rules: {
      ...(await import('typescript-eslint')).configs.recommendedTypeChecked[0].rules,
      ...(await import('eslint-plugin-react')).configs.recommended.rules,
      ...(await import('eslint-plugin-react-hooks')).configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prettier/prettier': 'error',
    },
  },
];