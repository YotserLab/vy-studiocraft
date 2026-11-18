# Plano de edição + Pós-publicação — prompts

## ✨ Plano de edição (JSON)

Contexto: `projContext(proj, {roteiro:true})`

```
{ctx}

Gere o plano de edição desse roteiro, parágrafo por parágrafo, estimando
o tempo com base em 145 palavras por minuto. Responda SOMENTE com um
JSON válido (sem markdown, sem texto antes ou depois): um array de
objetos com as chaves "tempo" (mm:ss de início), "narracao" (as
primeiras 6 a 10 palavras do trecho, entre aspas), "visual" (B-roll
específico: arquivo, screen recording, animação, gráfico, foto de quem,
print de quê), "sfx" (efeito sonoro curto: impact, whoosh, hit, glitch,
riser, none…) e "musica" (mood da trilha: tensão, dark, épica, leve,
silêncio, build-up…). Uma linha por parágrafo ou por mudança de visual,
entre 20 e 60 linhas.
```

System: `"Quando pedirem JSON, responda apenas o JSON."`
Botão "Aplicar": parseia o array e grava em `proj.plano`.

## Pós-publicação — contexto extra

O ctx inclui além do `projContext` a `retencaoParaIA(proj)` e:

```
RESULTADO APÓS PUBLICAÇÃO:
Views: {views} · Impressões: {impressoes} · CTR: {ctr}% ·
Retenção média: {retencao}% · Ainda assistindo aos 0:30 (Studio): {ret30}%
Duração média vista: {duracaoMedia} min · Inscritos ganhos: {inscritos}
Receita: R$ {receita} · RPM: {rpm} · Likes: {likes} · Comentários: {comentarios}
Thumbs: {nome "texto" CTR x%}
Anotações do criador — funcionou: {…} / não funcionou: {…} / comentários: {…}

HISTÓRICO DE OUTROS VÍDEOS PUBLICADOS DO CANAL:
- {titulo}: {views} views, CTR {ctr}%, retenção {ret}% | repetir: … | evitar: …
```

### ✨ Análise pós-publicação

```
{ctx}

Analise o desempenho desse vídeo. ## Diagnóstico (CTR vs retenção: o
problema foi a promessa, a entrega ou a distribuição?) ·
## O que funcionou (com evidência nos números) · ## O que não funcionou ·
## O que repetir · ## O que evitar · ## Comparação com o histórico do
canal. Seja específico e honesto; se faltarem dados, diga quais métricas
preencher.
```

Botão "Aplicar": preenche os 4 campos de lições (funcionou, não
funcionou, repetir, evitar).

### ✨ Regras pro playbook

```
{ctx}

Com base nesse resultado — principalmente a CURVA DE RETENÇÃO real e as
maiores quedas, além de CTR, retenção média e das minhas anotações —
extraia de 2 a 5 REGRAS acionáveis e GERAIS pro playbook do canal:
lições que valem pros próximos vídeos, não descrições só desse. Uma
regra por linha, no formato exato "[categoria] texto da regra".
Categorias válidas: titulo, thumb, ideia, edicao, narracao, retencao,
tema, estrutura. Ancore nos números; nada de obviedade.
```

Botão "Aplicar": extrai regras no formato `[cat] texto` e adiciona ao
playbook do usuário.

### ✨ Próximo vídeo

```
{ctx}

Com base nesse resultado e no histórico, proponha: ## 5 ideias de
próximo vídeo que aproveitam o que funcionou (título + hook de 1 frase
cada) · ## Ajustes de formato pro canal · ## Um experimento controlado
pra testar no próximo vídeo (uma variável só).
```
