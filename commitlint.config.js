/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'revert'],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'auth',
        'debts',
        'alerts',
        'open-finance',
        'voice',
        'ocr',
        'dashboard',
        'cooperative',
        'billing',
        'lgpd',
        'pwa',
        'infra',
        'ui',
        'types',
        'validators',
        'utils',
        'ci',
        'deps',
      ],
    ],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'header-max-length': [2, 'always', 100],
  },
};
