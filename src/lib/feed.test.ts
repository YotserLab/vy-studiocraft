// @vitest-environment jsdom
// jsdom é usado aqui porque seu DOMParser é fiel ao browser para text/xml
// (CDATA e documento <parsererror> em XML malformado); happy-dom diverge.
import {afterEach, describe, expect, it, vi} from 'vitest';
import {feedApi} from './dataClient';

const FEED_URL = 'https://feeds.exemplo.com/blog.xml';

const RSS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Canal Dev</title>
    <item>
      <title><![CDATA[Primeiro post]]></title>
      <link>https://blog.exemplo.com/post-1</link>
      <pubDate>Mon, 10 Nov 2026 10:00:00 GMT</pubDate>
      <description><![CDATA[<p>Resumo <b>com</b> HTML.</p>]]></description>
    </item>
    <item>
      <description>Segundo item sem título nem link.</description>
    </item>
  </channel>
</rss>`;

const ATOM_XML = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom News</title>
  <entry>
    <title>Entrada um</title>
    <link href="https://atom.exemplo.com/e1"/>
    <published>2026-11-01T12:00:00Z</published>
    <summary><![CDATA[Resumo <i>atom</i> aqui.]]></summary>
  </entry>
  <entry>
    <link href="https://atom.exemplo.com/e2"/>
    <updated>2026-11-02T08:30:00Z</updated>
    <content>Conteúdo da segunda entrada.</content>
  </entry>
</feed>`;

function mockFetchOk(body: string) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(body, {status: 200}));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('feedApi.fetchRss (NOT-R01/NOT-R02/NOT-R03)', () => {
  it('NOT-R01: busca via GET /api/feed?url= com credentials include', async () => {
    const fetchMock = mockFetchOk(RSS_XML);
    await feedApi.fetchRss(FEED_URL);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/feed?url=${encodeURIComponent(FEED_URL)}`,
      expect.objectContaining({credentials: 'include'})
    );
  });

  it('NOT-R02: faz parse de itens RSS <item> com título, link e data', async () => {
    mockFetchOk(RSS_XML);
    const res = await feedApi.fetchRss(FEED_URL);
    expect(res.channelTitle).toBe('Canal Dev');
    expect(res.items).toHaveLength(2);
    expect(res.items[0]).toEqual({
      title: 'Primeiro post',
      link: 'https://blog.exemplo.com/post-1',
      pubDate: 'Mon, 10 Nov 2026 10:00:00 GMT',
      summary: 'Resumo com HTML.',
      source: 'Canal Dev',
    });
  });

  it("NOT-R02: item RSS sem título vira 'Sem título' e sem link cai no URL do feed", async () => {
    mockFetchOk(RSS_XML);
    const res = await feedApi.fetchRss(FEED_URL);
    expect(res.items[1].title).toBe('Sem título');
    expect(res.items[1].link).toBe(FEED_URL);
    expect(res.items[1].pubDate).toBe('');
    expect(res.items[1].source).toBe('Canal Dev');
  });

  it('NOT-R03: resumo vem de description com HTML removido', async () => {
    mockFetchOk(RSS_XML);
    const res = await feedApi.fetchRss(FEED_URL);
    expect(res.items[0].summary).toBe('Resumo com HTML.');
    expect(res.items[0].summary).not.toContain('<');
  });

  it('NOT-R02: faz parse de entradas Atom <entry> (link via href)', async () => {
    mockFetchOk(ATOM_XML);
    const res = await feedApi.fetchRss(FEED_URL);
    expect(res.channelTitle).toBe('Atom News');
    expect(res.items).toHaveLength(2);
    expect(res.items[0]).toEqual({
      title: 'Entrada um',
      link: 'https://atom.exemplo.com/e1',
      pubDate: '2026-11-01T12:00:00Z',
      summary: 'Resumo atom aqui.',
      source: 'Atom News',
    });
    expect(res.items[1].title).toBe('Sem título');
    expect(res.items[1].pubDate).toBe('2026-11-02T08:30:00Z');
    expect(res.items[1].summary).toBe('Conteúdo da segunda entrada.');
  });

  it('limita o resultado a 24 itens', async () => {
    const items = Array.from(
      {length: 30},
      (_, i) => `<item><title>Post ${i + 1}</title><link>https://x.ex/${i}</link></item>`
    ).join('');
    mockFetchOk(`<rss version="2.0"><channel><title>C</title>${items}</channel></rss>`);
    const res = await feedApi.fetchRss(FEED_URL);
    expect(res.items).toHaveLength(24);
    expect(res.items[23].title).toBe('Post 24');
  });

  it('usa o hostname como channelTitle quando o feed não traz título', async () => {
    mockFetchOk('<rss version="2.0"><channel><item><title>A</title></item></channel></rss>');
    const res = await feedApi.fetchRss(FEED_URL);
    expect(res.channelTitle).toBe('feeds.exemplo.com');
    expect(res.items[0].source).toBe('feeds.exemplo.com');
  });

  it('XML malformado não lança erro: devolve itens vazios e título do hostname', async () => {
    mockFetchOk('<rss><channel><title>quebrado');
    const res = await feedApi.fetchRss(FEED_URL);
    expect(res.items).toEqual([]);
    expect(res.channelTitle).toBe('feeds.exemplo.com');
  });

  it('propaga erro da API (res.ok=false) com a mensagem do corpo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({error: 'Feed bloqueado'}), {status: 502})
      )
    );
    await expect(feedApi.fetchRss(FEED_URL)).rejects.toThrow('Feed bloqueado');
  });

  it('erro HTTP sem corpo JSON usa mensagem genérica com o status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('bad gateway', {status: 502}))
    );
    await expect(feedApi.fetchRss(FEED_URL)).rejects.toThrow('Erro ao carregar feed (502)');
  });
});
