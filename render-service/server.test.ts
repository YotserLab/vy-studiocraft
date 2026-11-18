// Testes do render-service (Express + Remotion + Gemini) contra as regras
// REN-R01..R11 de spec/dominios/render.yaml.
//
// Estratégia: importa server.ts em processo de teste com MEDIA_DIR em tmpdir,
// RENDER_PORT em porta livre e `node:child_process` mockado via mock.module —
// assim `exec` nunca invoca o `bunx @remotion/cli` real (render pesado), mas
// ainda exercita montagem de comando, validação, arquivos e respostas HTTP.
import { test, expect, mock, beforeAll, afterAll, describe } from 'bun:test';
import { promisify } from 'node:util';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';

// ---------------------------------------------------------------------------
// Mock de node:child_process.exec — captura comando/opções e simula o render.
// ---------------------------------------------------------------------------
type ExecCall = { command: string; options: Record<string, unknown> };
const execState = {
  calls: [] as ExecCall[],
  createOutput: true,
  error: null as (Error & { stderr?: string; stdout?: string }) | null,
  stderr: 'mock-stderr-from-remotion',
  propsJson: null as string | null,
};

mock.module('node:child_process', () => {
  const custom = (command: string, options: Record<string, unknown>) => {
    execState.calls.push({ command, options });
    const err = execState.error;
    if (err) {
      execState.error = null;
      return Promise.reject(err);
    }
    // O serviço embute o caminho de saída entre aspas no comando shell.
    const outMatch = /remotion render \S+ \S+ "([^"]+)"/.exec(command);
    if (outMatch && execState.createOutput) {
      fs.mkdirSync(path.dirname(outMatch[1]), { recursive: true });
      fs.writeFileSync(outMatch[1], Buffer.from('fake-mp4-bytes'));
    }
    const propsMatch = /--props="([^"]+)"/.exec(command);
    execState.propsJson =
      propsMatch && fs.existsSync(propsMatch[1])
        ? fs.readFileSync(propsMatch[1], 'utf8')
        : null;
    return Promise.resolve({ stdout: 'mock-stdout', stderr: execState.stderr });
  };
  const fakeExec: any = (
    command: string,
    options: Record<string, unknown>,
    callback?: (err: Error | null, stdout?: string, stderr?: string) => void,
  ) => {
    custom(command, options).then(
      (r: any) => callback?.(null, r.stdout, r.stderr),
      (e: Error) => callback?.(e),
    );
    return { pid: 0, kill() {} };
  };
  fakeExec[promisify.custom] = custom;
  return { exec: fakeExec };
});

// ---------------------------------------------------------------------------
// Ambiente isolado — env vars precisam existir ANTES de importar server.ts.
// ---------------------------------------------------------------------------
const MEDIA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'vyst-render-media-'));
const RENDERED_DIR = path.join(MEDIA_DIR, 'rendered');
const THUMBNAILS_DIR = path.join(MEDIA_DIR, 'thumbnails');

const PORT = await new Promise<number>((resolve, reject) => {
  const srv = net.createServer();
  srv.once('error', reject);
  srv.listen(0, '127.0.0.1', () => {
    const p = (srv.address() as net.AddressInfo).port;
    srv.close(() => resolve(p));
  });
});

process.env.MEDIA_DIR = MEDIA_DIR;
process.env.RENDER_PORT = String(PORT);
delete process.env.GEMINI_API_KEY; // força o caminho sem Gemini (ai === null)

await import('./server.ts');

const BASE = `http://127.0.0.1:${PORT}`;

async function waitForServer(): Promise<void> {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      await fetch(`${BASE}/api/rendered`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  throw new Error('render-service não subiu no porto de teste');
}

function postJson(p: string, body: unknown) {
  return fetch(`${BASE}${p}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function resetExec(overrides: Partial<typeof execState> = {}) {
  execState.calls = [];
  execState.createOutput = true;
  execState.error = null;
  execState.stderr = 'mock-stderr-from-remotion';
  execState.propsJson = null;
  Object.assign(execState, overrides);
}

beforeAll(waitForServer);
afterAll(() => {
  fs.rmSync(MEDIA_DIR, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// REN-R01 — POST /api/render aceita templateId/compositionId/props/resolution
// e codec com default h264.
// ---------------------------------------------------------------------------
describe('REN-R01 POST /api/render — payload aceito', () => {
  test('REN-R01: templateId do mapa resolve a composition e default codec=h264', async () => {
    resetExec();
    const res = await postJson('/api/render', {
      templateId: 'rem-ppt-steps',
      props: { title: 'Olá' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.compositionId).toBe('StepProcessInfographic');
    expect(body.filename).toMatch(/^render_StepProcessInfographic_\d+\.mp4$/);
    expect(body.videoUrl).toBe(`/rendered/${body.filename}`);
    expect(typeof body.sizeBytes).toBe('number');
    expect(typeof body.sizeMb).toBe('string');
    expect(typeof body.renderTimeMs).toBe('number');

    expect(execState.calls.length).toBe(1);
    expect(execState.calls[0].command).toContain('--codec=h264');
    // props serializados para arquivo temporário passado via --props=
    expect(execState.calls[0].command).toContain('--props=');
    expect(execState.propsJson).toBe(JSON.stringify({ title: 'Olá' }));
  });

  test('REN-R01: compositionId explícito tem precedência sobre templateId', async () => {
    resetExec();
    const res = await postJson('/api/render', {
      templateId: 'rem-ppt-steps',
      compositionId: 'CustomComp',
    });
    const body = await res.json();
    expect(body.compositionId).toBe('CustomComp');
    expect(execState.calls[0].command).toContain('remotion render');
    expect(execState.calls[0].command).toContain(' CustomComp ');
  });

  test('REN-R01: codec explícito é repassado ao comando', async () => {
    resetExec();
    await postJson('/api/render', { templateId: 'rem-torn-doc', codec: 'vp9' });
    expect(execState.calls[0].command).toContain('--codec=vp9');
  });

  test('REN-R01: sem props, arquivo temporário recebe objeto vazio', async () => {
    resetExec();
    await postJson('/api/render', { templateId: 'rem-ppt-steps' });
    expect(execState.propsJson).toBe('{}');
  });
});

// ---------------------------------------------------------------------------
// REN-R02 — resolution '720p' -> --scale=0.6666666666666666, '4K' -> --scale=2,
// demais valores sem escala.
// ---------------------------------------------------------------------------
describe('REN-R02 resolution -> flag --scale', () => {
  test("REN-R02: '720p' adiciona --scale=0.6666666666666666", async () => {
    resetExec();
    await postJson('/api/render', { templateId: 'rem-ppt-steps', resolution: '720p' });
    expect(execState.calls[0].command).toContain('--scale=0.6666666666666666');
  });

  test("REN-R02: '4K' adiciona --scale=2", async () => {
    resetExec();
    await postJson('/api/render', { templateId: 'rem-ppt-steps', resolution: '4K' });
    expect(execState.calls[0].command).toContain('--scale=2');
  });

  test("REN-R02: '1080p' e ausência de resolution não adicionam --scale", async () => {
    resetExec();
    await postJson('/api/render', { templateId: 'rem-ppt-steps', resolution: '1080p' });
    await postJson('/api/render', { templateId: 'rem-ppt-steps' });
    expect(execState.calls[0].command).not.toContain('--scale=');
    expect(execState.calls[1].command).not.toContain('--scale=');
  });
});

// ---------------------------------------------------------------------------
// REN-R03 — fallback de composition: templateId ausente -> StepProcessInfographic.
// NOTA: o comportamento real difere do texto da spec — um templateId
// desconhecido porém truthy é usado verbatim (o ramo 'Shorts' ->
// TornDocumentClipShorts é inalcançável: quando templateId é falsy, ?.includes
// já é falsy). Os testes documentam o comportamento existente.
// ---------------------------------------------------------------------------
describe('REN-R03 fallback de composition', () => {
  test('REN-R03: sem templateId/compositionId cai em StepProcessInfographic', async () => {
    resetExec();
    const res = await postJson('/api/render', { props: {} });
    const body = await res.json();
    expect(body.compositionId).toBe('StepProcessInfographic');
  });

  test('REN-R03: templateId desconhecido (truthy) é usado verbatim como composition', async () => {
    resetExec();
    const res = await postJson('/api/render', { templateId: 'comp-que-nao-existe' });
    const body = await res.json();
    // Comportamento existente: não cai no fallback — o id vai para o comando.
    expect(body.compositionId).toBe('comp-que-nao-existe');
  });

  test('REN-R03: templateId do mapa (incl. nome de componente direto) resolve mapeado', async () => {
    resetExec();
    const res = await postJson('/api/render', { templateId: 'DocumentaryCollageScene' });
    const body = await res.json();
    expect(body.compositionId).toBe('DocumentaryCollageScene');
  });
});

// ---------------------------------------------------------------------------
// REN-R04 — saída render_<comp>_<ts>.mp4 em MEDIA_DIR/rendered, servida em
// /rendered/. Cobre também os mounts estáticos de mídia.
// ---------------------------------------------------------------------------
describe('REN-R04 saída e diretórios estáticos', () => {
  test('REN-R04: filename render_<compositionId>_<timestamp>.mp4 em MEDIA_DIR/rendered', async () => {
    resetExec();
    const before = Date.now();
    const res = await postJson('/api/render', { templateId: 'rem-ppt-timeline' });
    const body = await res.json();
    const m = /^render_TimelineInfographic_(\d+)\.mp4$/.exec(body.filename);
    expect(m).not.toBeNull();
    const ts = Number(m![1]);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(Date.now());
    expect(fs.existsSync(path.join(RENDERED_DIR, body.filename))).toBe(true);
  });

  test('REN-R04: /rendered/<file> serve o arquivo gerado', async () => {
    resetExec();
    const res = await postJson('/api/render', { templateId: 'rem-ppt-steps' });
    const body = await res.json();
    const vid = await fetch(`${BASE}${body.videoUrl}`);
    expect(vid.status).toBe(200);
    expect(await vid.text()).toBe('fake-mp4-bytes');
  });

  test('REN-R04/R09 (lado TS): demais mounts de mídia servem MEDIA_DIR', async () => {
    fs.writeFileSync(path.join(THUMBNAILS_DIR, 'thumb_test.png'), 'png-bytes');
    const res = await fetch(`${BASE}/thumbnails/thumb_test.png`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('png-bytes');
  });

  test('REN-R04: arquivo inexistente sob /rendered retorna 404', async () => {
    const res = await fetch(`${BASE}/rendered/nao-existe.mp4`);
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// REN-R05 — se o arquivo de saída não é gerado, 500 com o stderr do render.
// ---------------------------------------------------------------------------
describe('REN-R05 falha de render -> 500', () => {
  test('REN-R05: sem arquivo de saída retorna 500 com stderr embutido no erro', async () => {
    resetExec({ createOutput: false, stderr: 'render exploded' });
    const res = await postJson('/api/render', { templateId: 'rem-ppt-steps' });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    // O stderr do render vai embutido na mensagem do Error lançado —
    // `details` fica ausente porque o Error não tem .stderr/.stdout.
    expect(body.error).toContain('Output file not generated');
    expect(body.error).toContain('render exploded');
    expect(body.details).toBeUndefined();
  });

  test('REN-R05: exec que lança erro retorna 500 com error.stderr/stdout em details', async () => {
    resetExec({
      error: Object.assign(new Error('spawn failed'), { stderr: 'boom-stderr' }),
    });
    const res = await postJson('/api/render', { templateId: 'rem-ppt-steps' });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('spawn failed');
    expect(body.details).toBe('boom-stderr');
  });
});

// ---------------------------------------------------------------------------
// REN-R06 — GET /api/rendered lista mp4 ordenados por createdAt decrescente.
// ---------------------------------------------------------------------------
describe('REN-R06 GET /api/rendered — listagem', () => {
  test('REN-R06: lista só .mp4, shape correto, ordenado por mtime desc', async () => {
    const oldName = 'zz_old_render.mp4';
    const newName = 'aa_new_render.mp4';
    fs.writeFileSync(path.join(RENDERED_DIR, oldName), 'old');
    fs.writeFileSync(path.join(RENDERED_DIR, newName), 'newer');
    fs.writeFileSync(path.join(RENDERED_DIR, 'nao_lista.txt'), 'txt');
    // mtimes futuras garantem que estes dois venham antes dos renders do mock.
    const t1 = new Date(Date.now() + 60_000);
    const t2 = new Date(Date.now() + 120_000);
    fs.utimesSync(path.join(RENDERED_DIR, oldName), t1, t1);
    fs.utimesSync(path.join(RENDERED_DIR, newName), t2, t2);

    const res = await fetch(`${BASE}/api/rendered`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.videos)).toBe(true);
    expect(body.videos.every((v: any) => v.filename.endsWith('.mp4'))).toBe(true);
    expect(body.videos.some((v: any) => v.filename === 'nao_lista.txt')).toBe(false);

    expect(body.videos[0].filename).toBe(newName);
    expect(body.videos[1].filename).toBe(oldName);

    const item = body.videos[0];
    expect(item.videoUrl).toBe(`/rendered/${newName}`);
    expect(typeof item.sizeBytes).toBe('number');
    expect(typeof item.sizeMb).toBe('string');
    expect(item.createdAt).toBeDefined();
    // Ordenação estritamente decrescente por createdAt.
    for (let i = 1; i < body.videos.length; i++) {
      const prev = new Date(body.videos[i - 1].createdAt).getTime();
      const curr = new Date(body.videos[i].createdAt).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });
});

// ---------------------------------------------------------------------------
// REN-R07 — /api/gemini/generate-script exige topic; sem GEMINI_API_KEY cai no
// fallback local com JSON de cenas. (Caminho com gemini-2.5-flash exige rede
// real — coberto apenas até a bifurcação.)
// ---------------------------------------------------------------------------
describe('REN-R07 /api/gemini/* — validação e fallback sem chave', () => {
  test('REN-R07: generate-script sem topic retorna 400', async () => {
    const res = await postJson('/api/gemini/generate-script', { tone: 'x' });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Topic is required');
  });

  test('REN-R07: sem GEMINI_API_KEY, generate-script retorna fallback com cenas', async () => {
    const res = await postJson('/api/gemini/generate-script', {
      topic: 'buracos negros',
      videoType: 'Shorts',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const data = body.data;
    expect(data.title).toBe('Roteiro: buracos negros');
    expect(data.durationSeconds).toBe(30);
    expect(Array.isArray(data.scenes)).toBe(true);
    expect(data.scenes.length).toBe(3);
    expect(data.scenes[0].voiceover).toContain('buracos negros');
    expect(data.visualStyle.colorPalette.length).toBeGreaterThan(0);
    expect(typeof data.aiPrompt).toBe('string');
  });

  test('REN-R07 (aux): generate-prompt sem chave retorna fallback de prompts', async () => {
    const res = await postJson('/api/gemini/generate-prompt', {
      concept: 'documento rasgado',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.prompts)).toBe(true);
    expect(body.data.prompts.length).toBeGreaterThanOrEqual(1);
    const p = body.data.prompts[0];
    expect(typeof p.title).toBe('string');
    expect(typeof p.prompt).toBe('string');
    expect(typeof p.cameraMotion).toBe('string');
    expect(typeof p.lighting).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// REN-R10 — render invoca bunx @remotion/cli com timeout 600s e concurrency=8.
// ---------------------------------------------------------------------------
describe('REN-R10 invocação do CLI Remotion', () => {
  test('REN-R10: comando usa bunx @remotion/cli, --concurrency=8, timeout 600s', async () => {
    resetExec();
    await postJson('/api/render', { templateId: 'rem-ppt-steps' });
    const { command, options } = execState.calls[0];
    expect(command).toMatch(/^bunx --package @remotion\/cli remotion render /);
    expect(command).toContain('--concurrency=8');
    expect(command).toContain('--log=warn');
    expect(command).toContain('src/remotion-templates/remotion/index.ts');
    expect(options.timeout).toBe(600000);
  });
});

// ---------------------------------------------------------------------------
// REN-R11 — biblioteca de ~100 famílias de templates em
// src/remotion-templates/remotion/families (*.tsx + *.registry.json).
// ---------------------------------------------------------------------------
describe('REN-R11 famílias de templates', () => {
  test('REN-R11: families/ contém ~100 famílias (tsx espelhado por registry.json)', () => {
    const familiesDir = path.resolve(
      process.cwd(),
      'src/remotion-templates/remotion/families',
    );
    const entries = fs.readdirSync(familiesDir);
    const tsx = entries.filter((f) => f.endsWith('.tsx'));
    const registries = entries.filter((f) => f.endsWith('.registry.json'));
    // "~100" na spec — toleramos 90..110 para não fragilizar o teste.
    expect(tsx.length).toBeGreaterThanOrEqual(90);
    expect(tsx.length).toBeLessThanOrEqual(110);
    expect(registries.length).toBe(tsx.length);
  });
});

// ---------------------------------------------------------------------------
// Guards de request — express.json({ limit: '2mb' }) e JSON malformado.
// ---------------------------------------------------------------------------
describe('request guards', () => {
  test('guard: body > 2mb é rejeitado com 413', async () => {
    const res = await fetch(`${BASE}/api/render`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ templateId: 'x', props: { pad: 'a'.repeat(3 * 1024 * 1024) } }),
    });
    expect(res.status).toBe(413);
  });

  test('guard: JSON malformado é rejeitado com 400', async () => {
    const res = await fetch(`${BASE}/api/render`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{nao-e-json',
    });
    expect(res.status).toBe(400);
  });
});
