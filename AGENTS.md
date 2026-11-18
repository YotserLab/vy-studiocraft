## Protocolo spec-first (obrigatório)
Para app novo ou feature grande, NÃO escreva código antes de a spec passar no portão.
1. A spec vive em `spec/` (domínios, regras com ID, checklist). O portão está vendored em `spec/tools/spec-first/` — requer PyYAML.
2. Portão: `python spec/tools/spec-first/scripts/check.py check` deve terminar com OK. Para planejar: `check --plan`.
3. Ao codar, cite os IDs das regras (ex.: `CON-R01`) em comentários e nomes de testes.
4. No fim: `python spec/tools/spec-first/scripts/check.py trace --strict`. Mudou comportamento? Atualize a spec primeiro.
Bugfix pequeno e ajuste visual não precisam de spec.
