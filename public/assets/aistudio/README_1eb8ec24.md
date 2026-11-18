# Prompts de IA do Bobo Studio — engenharia reversa

Extraído de `public/index.html` (app original espelhado). Todas as chamadas
passam por `iaCall(prompt, {system, maxTokens, temperature})`, que despacha
para Anthropic, provedores OpenAI-compatíveis ou Google Gemini conforme
configuração do usuário (Configurações → IA).

O prompt do usuário é quase sempre `projContext(projeto)` + instrução
específica do botão. O `projContext` monta:

```
PROJETO DE VÍDEO
Canal: {canal}
Título provisório: {titulo}
Hook: {hook}
Resumo: {resumo}
Por que é interessante: {porque}
Categoria: {categoria} · Palavras-chave: {palavrasChave}

ROTEIRO ATUAL:          (só quando roteiro=true)
## {capítulo} …

FONTES DE PESQUISA:     (só quando fontes=true e houver fontes)
1. [{tipo}] {titulo} — {url}
   Comprova que: {obs}
```

Temperaturas usadas: `.2` tradução/JSON · `.3`–`.4` extração estruturada ·
`.7`–`.8` criação. `maxTokens` varia 800–12000.

## Arquivos

| Arquivo | Botões/telas cobertos |
|---|---|
| `projeto-ideia.md` | Aba Informações do projeto (análise, títulos, hooks, descrição/tags) |
| `projeto-roteiro.md` | Aba Roteiro (retenção, estrutura, b-roll, CTA, revisão) |
| `projeto-pesquisa.md` | Aba Pesquisa (resumo de fontes, lacunas, checagem) |
| `projeto-thumb.md` | Aba Thumbnail (conceitos, textos, prompts de imagem) |
| `projeto-plano-pos.md` | Plano de edição + Pós-publicação (análise, regras, próximo vídeo) |
| `roteirista.md` | Página Roteirista IA (perfil + geração de roteiro completo) |
| `radar.md` | Radar (DNA da oportunidade, pauta, nomes de assunto) |
| `assistente-bobo.md` | Chat flutuante (system + contexto + ação CRIAR_IDEIA) |
| `comparar-30s.md` | Comparar aberturas com dados do YouTube Analytics |
| `canal.md` | Análise do meu canal |
| `noticias.md` | Curadoria de manchetes |
| `suno.md` | Prompt de música pro Suno por capítulo |
| `comentarios.md` | Responder comentários do YouTube |
| `traducao.md` | Traduções (títulos de vídeo, notícias, artigos) |

> Os templates contêm placeholders `${...}` em JS — substituídos em runtime
> pelos dados reais do projeto/canal. Onde a resposta é parseada, o prompt
> exige JSON ou formato markdown exato (## seções).
