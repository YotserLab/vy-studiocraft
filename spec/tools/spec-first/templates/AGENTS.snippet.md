## Spec-first protocol (mandatory)
For a new app or a large feature, DO NOT write code before the spec passes the gate.
1. Read `{{skill}}/SKILL.md` and follow the flow (short interview -> spec YAML in `spec/` -> review).
2. Gate: `python {{script}} check` must end with OK. To plan: `check --plan`.
3. When coding, cite rule IDs (e.g. `PED-R01`) in comments and test names.
4. At the end: `python {{script}} trace --strict`. Changed behavior? Update the spec first.
Small bugfixes and visual tweaks do not need a spec.
