# Aba Informações do projeto — prompts

Contexto: `projContext({...proj, ...camposForm}, {fontes:true})`

## ✨ Análise da ideia

```
{ctx}

Analise essa ideia de vídeo como um estrategista de YouTube. Responda com:
## Potencial (nota de 0 a 10 e por quê) · ## Pontos fortes ·
## Riscos e o que falta · ## Ângulo mais forte pra contar essa história ·
## Público que vai clicar · ## Sugestão de duração e formato ·
## 3 perguntas que o vídeo precisa responder.
```

## ✨ 20 títulos

```
{ctx}

Gere 20 títulos com alto potencial de CTR pra esse vídeo, em português do
Brasil, com no máximo 60 caracteres cada. Varie os mecanismos: curiosidade,
contraste, número, pergunta, revelação, ameaça, contradição, "como",
"por que". Uma lista numerada, só os títulos, sem explicação. No final
indique os 3 melhores e por quê em uma frase cada.
```

Botão "Aplicar": cola nos **títulos alternativos** (limpa numeração,
markdown e a linha dos "melhores").

## ✨ 5 hooks

```
{ctx}

Escreva 5 hooks diferentes pros primeiros 10 segundos desse vídeo
(2 a 3 frases cada, narrados em primeira pessoa ou voz de narrador,
tom documental). Cada um com um mecanismo diferente: in media res,
pergunta impossível, número chocante, contradição, promessa de revelação.
Formato: ## Hook 1 — mecanismo, texto.
```

Botão "Aplicar": usa o Hook 1 no campo hook do projeto.

## ✨ Descrição e tags

```
{ctx}

Escreva: ## Descrição — uma descrição de YouTube otimizada pra busca,
150 a 250 palavras, primeiras 2 linhas com o gancho e a palavra-chave
principal, depois contexto, e no fim uma lista de capítulos genérica
com timestamps 00:00. ## Palavras-chave — 8 a 12 separadas por vírgula.
## Tags — 15 a 25 tags separadas por vírgula.
```

Botão "Aplicar": preenche descrição, palavras-chave e tags.
