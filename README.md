# figma-audit

A read-only Figma audit plugin for Claude Code, by [Mykhailo Pashynskyi](https://github.com/mykhailo-pashynskyi).

Audits a Figma file for code-handoff readiness (Variables, Text Styles, Components, Auto Layout, naming, screen states), accessibility (WCAG 2.2, contrast per color mode, focus states) and platform/device/stack fit (iOS incl. iPhone Duo, Android, Web). With your approval it renames default-named layers; it changes nothing else.

## Install

```
/plugin marketplace add mykhailo-pashynskyi/REPO_NAME
/plugin install figma-audit@figma-audit
```

Full documentation: [plugins/figma-audit/README.md](plugins/figma-audit/README.md)

## License

[MIT](LICENSE) © 2026 Mykhailo Pashynskyi
