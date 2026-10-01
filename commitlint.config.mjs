// Reglas de mensajes de commit (Conventional Commits). Ver docs/commits.md.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Permitimos cuerpos/footers con líneas largas (bodies detallados, Co-Authored-By).
    'body-max-line-length': [0, 'always'],
    'footer-max-line-length': [0, 'always'],
    // Tipos permitidos (alineados con docs/commits.md).
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'refactor', 'test', 'chore', 'build', 'ci', 'perf', 'style', 'revert'],
    ],
  },
};
