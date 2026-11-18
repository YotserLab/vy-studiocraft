# Traduções — prompts

Todas com `temperature:.2` e resposta em JSON estrito.

## Títulos de vídeos salvos/canais

`maxTokens:4000`. System: `"Responda apenas JSON válido."`

```
Traduza para português do Brasil os títulos abaixo. Mantenha nomes
próprios e siglas. Responda SOMENTE um JSON válido: array de
{"id","pt"}.

[{"id":…,"titulo":…}]
```

## Títulos + resumos de notícias

`maxTokens:12000`. System: `"Responda APENAS com o JSON pedido — sem
markdown, sem explicação, sem raciocínio antes ou depois."`

```
Traduza para português do Brasil os textos abaixo (títulos e resumos
de matérias de notícia). Mantenha nomes próprios, marcas e siglas.
Responda SOMENTE um JSON válido: array de {"i","t","s"}, onde
t = título traduzido e s = resumo traduzido.

[{"i":…,"t":…,"s":…}]
```

## Artigo completo (notícia)

`maxTokens:12000`. System: `"Responda APENAS com o JSON pedido, sem
markdown, sem explicação, sem raciocínio."`

```
Traduza para o português do Brasil o TÍTULO e o TEXTO abaixo. Mantenha
nomes próprios, marcas e siglas. Responda APENAS um JSON válido no
formato {"titulo":"...","texto":"..."}.

TÍTULO: {title}

TEXTO: {full ou snippet}
```
