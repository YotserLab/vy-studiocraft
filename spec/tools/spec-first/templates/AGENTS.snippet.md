## Protocolo spec-first (obrigatório)
Para app novo ou feature grande, NÃO escreva código antes de a spec passar no portão.
1. Leia `{{skill}}/SKILL.md` e siga o fluxo (entrevista curta -> spec YAML em `spec/` -> revisão).
2. Portão: `python {{script}} check` deve terminar com OK. Para planejar: `check --plan`.
3. Ao codar, cite os IDs das regras (ex.: `PED-R01`) em comentários e nomes de testes.
4. No fim: `python {{script}} trace --strict`. Mudou comportamento? Atualize a spec primeiro.
Bugfix pequeno e ajuste visual não precisam de spec.
