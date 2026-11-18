## Spec-first protocol (mandatory)
For a new app or a large feature, DO NOT write code before the spec passes the gate.
1. The spec lives in `spec/` (domains, ID-tagged rules, checklist). The gate is vendored at `spec/tools/spec-first/` — requires PyYAML.
2. Gate: `python spec/tools/spec-first/scripts/check.py check` must end with OK. To plan: `check --plan`.
3. When coding, cite rule IDs (e.g. `CON-R01`) in comments and test names.
4. At the end: `python spec/tools/spec-first/scripts/check.py trace --strict`. Changed behavior? Update the spec first.
Small bugfixes and visual tweaks do not need a spec.
