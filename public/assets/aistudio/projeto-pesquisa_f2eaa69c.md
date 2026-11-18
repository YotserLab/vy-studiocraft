# Aba Pesquisa do projeto — prompts

Contexto: `projContext(proj, {roteiro:true, fontes:true})`

## ✨ Resumo das fontes

```
{ctx}

Com base apenas nas fontes listadas (títulos, URLs e observações), monte:
## Linha do tempo dos fatos · ## Números e dados citáveis (com a fonte
de cada um) · ## Personagens e empresas envolvidas ·
## As 5 informações mais fortes pro vídeo · ## Contradições ou pontos
que precisam de confirmação. Não invente fatos que não estejam nas
observações; onde faltar, diga "verificar na fonte".
```

## ✨ Lacunas de pesquisa

```
{ctx}

Compare o que o roteiro/ideia promete com o que as fontes cobrem. Liste:
## Afirmações sem fonte · ## Perguntas que o público vai fazer e ainda
não temos resposta · ## 10 buscas sugeridas (termos exatos, em português
e inglês) · ## Tipos de fonte que dariam mais credibilidade (documento
oficial, entrevista, dado primário).
```

## ✨ Checagem do roteiro

```
{ctx}

Percorra o roteiro parágrafo por parágrafo e classifique cada afirmação
factual como: ✅ coberta por fonte (qual), ⚠️ parcialmente coberta,
❌ sem fonte. Formato: lista com o trecho entre aspas → classificação →
fonte. No final, ## Trechos que eu não publicaria sem confirmar.
```
