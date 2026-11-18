# Aba Roteiro do projeto — prompts

Contexto: `projContext({...proj, capitulos}, {roteiro:true, fontes:true})`
(inclui o roteiro completo formatado `## capítulo` + fontes)

## ✨ Análise de retenção

```
{ctx}

Analise o roteiro como um editor de retenção de YouTube. Para cada
capítulo, aponte: onde o espectador pode abandonar (trechos lentos,
excesso de contexto, falta de tensão, promessas não pagas), com o trecho
citado e uma reescrita sugerida. Depois: ## Curva de retenção prevista
(descreva minuto a minuto) · ## 5 mudanças de maior impacto ·
## Open loops que podem ser plantados no início.
```

## ✨ Estrutura por capítulos

```
{ctx}

Proponha a estrutura ideal desse vídeo em capítulos (6 a 9), no formato
de documentário narrado. Para cada capítulo: ## NN — Nome · objetivo do
bloco · duração estimada · o que precisa acontecer · gancho pro próximo
bloco. Use os fatos das fontes quando existirem.
```

Botão "Aplicar": substitui os capítulos atuais pelos nomes gerados
(pede confirmação; textos existentes são perdidos).

## ✨ B-roll por parágrafo

```
{ctx}

Para cada parágrafo do roteiro, sugira o visual: B-roll (arquivo,
screen recording, animação, stock), texto na tela, e se cabe um gráfico
ou mapa. Formato por capítulo: ## Nome do capítulo, depois uma lista
onde cada item começa com as 5 primeiras palavras do parágrafo entre
aspas → visual sugerido. Seja específico (ex.: "print do site da
Microsoft em 2001", não "imagem de computador").
```

## ✨ CTA

```
{ctx}

Escreva 3 opções de CTA final (15 a 25 segundos narrados cada) que
conectem com o tema do vídeo e peçam inscrição/comentário de forma
natural, com uma pergunta pro público. Formato: ## Opção 1, 2, 3.
```

## ✨ Revisão de texto

```
{ctx}

Revise o roteiro pra narração: corrija gramática e concordância, troque
frases longas por curtas, elimine repetições e clichês, deixe mais
falado e menos escrito. Mantenha o tom e o conteúdo. Devolva o roteiro
completo revisado no mesmo formato (## capítulo, texto), e no final
## O que mudei em 5 linhas.
```

Botão "Aplicar": substitui o roteiro pelos capítulos revisados
(pede confirmação).
