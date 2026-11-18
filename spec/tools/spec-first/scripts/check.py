#!/usr/bin/env python3
"""spec-first: portão de spec para agentes de código.

Uso (de dentro do projeto):
  check.py init <P|M|G>            cria spec/ e instala o protocolo no AGENTS.md
  check.py dominio <nome> <PREF>   cria spec/dominios/<nome>.yaml
  check.py packs list|add <nomes>  lista packs / adiciona itens ao checklist
  check.py check [--plan]          valida a spec (exit 1 se houver problemas)
  check.py report                  gera spec/SPEC.md (visão legível)
  check.py trace [--strict]        cruza IDs de regras com código e testes
"""
import argparse
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("Falta PyYAML: pip install pyyaml")

SKILL = Path(__file__).resolve().parent.parent
RULE = r"[A-Z]{2,6}-R\d{2,3}"
RULE_RE = re.compile(rf"\b{RULE}\b")
REF_RE = re.compile(rf"\b(?:{RULE}|NF\d{{2,3}}|P\d{{2,3}})\b")
MAX_LEN, MAX_RULES = 140, 15
MAX_DOMS = {"P": 2, "M": 6}
MAX_SHOWN = 40


# ---------- util ----------
def safe_load(path, errs):
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
    except yaml.YAMLError as e:
        errs.append(f"{path}: YAML inválido (texto com ': ' precisa de aspas): {e}")
        return None
    return {} if data is None else data


def walk(o):
    if isinstance(o, dict):
        for k, v in o.items():
            yield str(k)
            yield from walk(v)
    elif isinstance(o, (list, tuple)):
        for v in o:
            yield from walk(v)
    elif o is not None:
        yield str(o)


def packs_available():
    out = {}
    for f in sorted((SKILL / "packs").glob("*.yaml")):
        p = yaml.safe_load(f.read_text(encoding="utf-8"))
        out[p["pack"]] = p
    return out


def is_str(v):
    return isinstance(v, str) and v.strip() != ""


def struct_or_na(dom, key, tag, E):
    v = dom.get(key)
    if isinstance(v, str):
        if not (v.strip().lower().startswith("na:") and len(v.strip()) >= 8):
            E.append(f"{tag}: '{key}' deve ser estrutura ou 'na: motivo'")
    elif not v:
        E.append(f"{tag}: '{key}' vazio (preencha ou use 'na: motivo')")


# ---------- check ----------
def check_spec(spec, E, W):
    dict_keys = ["usuarios", "nao_funcionais", "premissas", "packs_descartados"]
    list_keys = ["escopo", "fora_de_escopo", "dominios", "duvidas"]
    need = ["porte", "visao"] + dict_keys + list_keys
    missing = [k for k in need if k not in spec]
    if missing:
        E.append(f"spec.yaml: faltam chaves: {', '.join(missing)}")
        return False
    for k in dict_keys:
        spec[k] = spec[k] or {}
    for k in list_keys:
        spec[k] = spec[k] or []
    if spec["porte"] not in ("P", "M", "G"):
        E.append("spec.yaml: porte deve ser P, M ou G")
    if not is_str(spec["visao"]) or len(spec["visao"]) > 200:
        E.append("spec.yaml: 'visao' deve ser 1 frase (<= 200 caracteres)")
    if not spec["usuarios"]:
        E.append("spec.yaml: 'usuarios' vazio")
    for k in ("escopo", "fora_de_escopo", "dominios"):
        if not spec[k]:
            E.append(f"spec.yaml: '{k}' vazio")
    lim = MAX_DOMS.get(spec["porte"])
    if lim and len(spec["dominios"]) > lim:
        E.append(f"spec.yaml: porte {spec['porte']} permite até {lim} domínios "
                 f"(tem {len(spec['dominios'])}); suba o porte ou agrupe")
    for q in spec["duvidas"]:
        E.append(f"dúvida aberta: {q}")
    for k in spec["nao_funcionais"]:
        if not re.fullmatch(r"NF\d{2,3}", str(k)):
            E.append(f"spec.yaml: id inválido em nao_funcionais: {k} (use NF01)")
    for k in spec["premissas"]:
        if not re.fullmatch(r"P\d{2,3}", str(k)):
            E.append(f"spec.yaml: id inválido em premissas: {k} (use P01)")
    for k, v in spec["packs_descartados"].items():
        if k == "base":
            E.append("spec.yaml: o pack 'base' não pode ser descartado")
        if not is_str(v) or len(v.strip()) < 5:
            E.append(f"spec.yaml: packs_descartados.{k} precisa de motivo (>= 5 caracteres)")
    if len(spec["escopo"]) > 12:
        W.append("escopo com mais de 12 itens: considere dividir em fases")
    return True


def check_domain(d, name, spec, E, prefixes):
    f = d / "dominios" / f"{name}.yaml"
    tag = f"dominios/{name}.yaml"
    if not f.exists():
        E.append(f"{tag}: não existe (listado em spec.yaml)")
        return {}, []
    dom = safe_load(f, E)
    if dom is None:
        return {}, []
    if dom.get("dominio") != name:
        E.append(f"{tag}: 'dominio' deve ser '{name}'")
    pref = dom.get("prefixo")
    if not (isinstance(pref, str) and re.fullmatch(r"[A-Z]{2,6}", pref)):
        E.append(f"{tag}: 'prefixo' deve ter 2-6 letras maiúsculas")
        pref = None
    elif pref in prefixes:
        E.append(f"{tag}: prefixo '{pref}' já usado em '{prefixes[pref]}'")
    else:
        prefixes[pref] = name
    if not is_str(dom.get("resumo")):
        E.append(f"{tag}: falta 'resumo'")

    ents = dom.get("entidades")
    if not isinstance(ents, dict) or not ents:
        E.append(f"{tag}: 'entidades' vazio")
        ents = {}
    for en, campos in ents.items():
        if not isinstance(campos, list) or not campos:
            E.append(f"{tag}: entidade '{en}' precisa de lista de campos")

    struct_or_na(dom, "estados", tag, E)
    if isinstance(dom.get("estados"), dict):
        for en, fl in dom["estados"].items():
            if en not in ents:
                E.append(f"{tag}: estados refere entidade inexistente '{en}'")
            if not is_str(fl) or "->" not in fl:
                E.append(f"{tag}: estados.{en} deve ter o formato 'a -> b | c'")

    struct_or_na(dom, "permissoes", tag, E)
    if isinstance(dom.get("permissoes"), dict):
        for ator, acoes in dom["permissoes"].items():
            if ator not in spec["usuarios"]:
                E.append(f"{tag}: ator '{ator}' não está em spec.usuarios")
            if not isinstance(acoes, list) or not acoes:
                E.append(f"{tag}: permissoes.{ator} precisa de lista de ações")

    regras = dom.get("regras")
    out = {}
    if not isinstance(regras, dict) or not regras:
        E.append(f"{tag}: 'regras' vazio")
    else:
        if len(regras) > MAX_RULES:
            E.append(f"{tag}: {len(regras)} regras (máx. {MAX_RULES}); divida o domínio")
        for rid, txt in regras.items():
            if pref and not re.fullmatch(rf"{pref}-R\d{{2,3}}", str(rid)):
                E.append(f"{tag}: id '{rid}' deve seguir {pref}-R01")
            if not is_str(txt):
                E.append(f"{tag}: {rid} sem texto")
            elif len(txt) > MAX_LEN:
                E.append(f"{tag}: {rid} tem {len(txt)} caracteres (máx. {MAX_LEN}); "
                         "reduza ou quebre em 2 regras")
            out[str(rid)] = txt

    refs = []
    cu = dom.get("casos_de_uso")
    if not isinstance(cu, dict) or not cu:
        E.append(f"{tag}: 'casos_de_uso' vazio")
    else:
        for k, v in cu.items():
            ids = RULE_RE.findall(str(v))
            if not ids:
                E.append(f"{tag}: caso de uso {k} não cita nenhuma regra")
            refs.append((f"{tag} {k}", ids))
    bordas = dom.get("bordas")
    if bordas is None or not isinstance(bordas, list):
        E.append(f"{tag}: 'bordas' deve ser uma lista (pode ser [])")
    else:
        for b in bordas:
            ids = RULE_RE.findall(str(b))
            if not ids:
                E.append(f"{tag}: borda sem regra associada: {str(b)[:60]}")
            refs.append((f"{tag} borda", ids))
    return out, refs


def check_checklist(d, spec, known, E, W, stats):
    f = d / "checklist.yaml"
    if not f.exists():
        E.append("checklist.yaml não existe")
        return
    ck = safe_load(f, E)
    if ck is None:
        return
    avail = packs_available()
    items = {i: p["pack"] for p in avail.values() for i in p["itens"]}
    desc = spec["packs_descartados"]
    for k in desc:
        if k != "base" and k not in avail:
            E.append(f"spec.yaml: packs_descartados refere pack inexistente '{k}'")
    for k in ck:
        if k not in items:
            E.append(f"checklist.yaml: item desconhecido '{k}'")
    used = {items[k] for k in ck if k in items}
    stats["packs"] = sorted(used)
    for name, p in avail.items():
        obrig = name == "base" or spec["porte"] in p.get("decisao_obrigatoria", ["P", "M", "G"])
        if name in used and name in desc:
            E.append(f"pack '{name}' está no checklist e em packs_descartados")
        if name not in used and name not in desc and obrig:
            E.append(f"pack '{name}' sem decisão ({p['quando']}): "
                     f"`packs add {name}` ou descarte com motivo em packs_descartados")
    pend = defaultdict(list)
    for name in used:
        for iid in avail[name]["itens"]:
            if iid not in ck:
                E.append(f"checklist.yaml: falta o item {iid}")
                continue
            v = str(ck[iid]).strip()
            stats["itens"] += 1
            if v == "?" or v == "":
                pend[name].append(iid)
            elif v.lower().startswith("na:"):
                if len(v) < 8:
                    E.append(f"checklist.yaml: {iid} 'na' precisa de motivo")
            elif v.lower().startswith("sim"):
                refs = REF_RE.findall(v)
                if not refs:
                    E.append(f"checklist.yaml: {iid} 'sim' precisa citar regra/NF/premissa")
                for r in refs:
                    if r not in known:
                        E.append(f"checklist.yaml: {iid} cita '{r}', que não existe")
            else:
                E.append(f"checklist.yaml: {iid} formato inválido (use 'sim ID', 'na: motivo' ou '?')")
    for name, ids in pend.items():
        E.append(f"pack '{name}': {len(ids)} itens pendentes ({', '.join(ids)})")


def check_plan(d, rules, require, E):
    f = d / "tarefas.yaml"
    if not f.exists():
        if require:
            E.append("tarefas.yaml não existe (formato: T01: {titulo: ..., regras: [PED-R01]})")
        return
    t = safe_load(f, E)
    if t is None:
        return
    covered = set()
    for tid, v in t.items():
        if not isinstance(v, dict) or not is_str(v.get("titulo")) or not v.get("regras"):
            E.append(f"tarefas.yaml: {tid} precisa de 'titulo' e 'regras'")
            continue
        for r in v["regras"]:
            if r not in rules:
                E.append(f"tarefas.yaml: {tid} cita regra inexistente '{r}'")
            covered.add(r)
    if require:
        for r in sorted(set(rules) - covered):
            E.append(f"tarefas.yaml: regra {r} não está em nenhuma tarefa")


def run_check(d, plan=False):
    E, W = [], []
    stats = {"dominios": 0, "regras": 0, "itens": 0, "packs": []}
    s = d / "spec.yaml"
    if not s.exists():
        return [f"{s} não existe. Rode: check.py init <P|M|G>"], W, stats
    spec = safe_load(s, E)
    if spec is None or not check_spec(spec, E, W):
        return E, W, stats
    rules, refs, prefixes = {}, [], {}
    for name in spec["dominios"]:
        r, rf = check_domain(d, name, spec, E, prefixes)
        for rid, txt in r.items():
            if rid in rules:
                E.append(f"regra duplicada: {rid}")
            rules[rid] = txt
        refs += rf
    listed = set(spec["dominios"])
    for f in sorted((d / "dominios").glob("*.yaml")):
        if f.stem not in listed:
            W.append(f"dominios/{f.name} não está em spec.dominios")
    for where, ids in refs:
        for i in ids:
            if i not in rules:
                E.append(f"{where}: cita regra inexistente '{i}'")
    stats["dominios"], stats["regras"] = len(listed), len(rules)
    known = set(rules) | set(map(str, spec["premissas"])) | set(map(str, spec["nao_funcionais"]))
    check_checklist(d, spec, known, E, W, stats)
    check_plan(d, rules, plan, E)
    for f in [s, d / "checklist.yaml"] + sorted((d / "dominios").glob("*.yaml")):
        if f.exists() and any("TODO" in x for x in walk(yaml.safe_load(f.read_text(encoding="utf-8")))):
            E.append(f"{f.relative_to(d)}: ainda contém TODO")
    return E, W, stats


def cmd_check(a):
    E, W, st = run_check(Path(a.dir), a.plan)
    for w in W:
        print(f"aviso: {w}")
    if E:
        print(f"FALHOU: {len(E)} problema(s). Corrija a spec e rode de novo.")
        for e in E[:MAX_SHOWN]:
            print(f" - {e}")
        if len(E) > MAX_SHOWN:
            print(f" ... +{len(E) - MAX_SHOWN} (corrija estes primeiro)")
        sys.exit(1)
    print(f"OK: {st['dominios']} domínios, {st['regras']} regras, "
          f"{st['itens']} itens de checklist ({', '.join(st['packs'])}).")


# ---------- init / dominio / packs ----------
def add_packs(d, names):
    avail = packs_available()
    f = d / "checklist.yaml"
    text = f.read_text(encoding="utf-8") if f.exists() else ""
    if text and not text.endswith("\n"):
        text += "\n"
    for n in names:
        if n not in avail:
            sys.exit(f"pack desconhecido: {n}. Veja: check.py packs list")
        p = avail[n]
        if f"{n}." in text and re.search(rf"^{re.escape(n)}\.\d{{2}}:", text, re.M):
            print(f"pack {n} já está no checklist")
            continue
        text += f"\n# --- pack {n}: {p['quando']}\n"
        for iid, q in p["itens"].items():
            text += f'{iid}: "?"   # {q}\n'
        print(f"adicionado: {n} ({len(p['itens'])} itens)")
    f.write_text(text, encoding="utf-8")


def cmd_init(a):
    d = Path(a.dir)
    if (d / "spec.yaml").exists():
        sys.exit(f"{d}/spec.yaml já existe")
    (d / "dominios").mkdir(parents=True, exist_ok=True)
    t = (SKILL / "templates" / "spec.yaml").read_text(encoding="utf-8")
    (d / "spec.yaml").write_text(t.replace("{{porte}}", a.porte), encoding="utf-8")
    (d / "checklist.yaml").write_text(
        '# Respostas: "sim ID[, ID]" (cita regra PED-R01, NF01 ou P01) | "na: motivo" | "?" (pendente)\n',
        encoding="utf-8")
    add_packs(d, ["base"])
    snip = (SKILL / "templates" / "AGENTS.snippet.md").read_text(encoding="utf-8")
    rel = lambda p: os.path.relpath(p, Path.cwd()).replace("\\", "/")
    snip = snip.replace("{{skill}}", rel(SKILL)).replace("{{script}}", rel(Path(__file__).resolve()))
    ag = Path("AGENTS.md")
    cur = ag.read_text(encoding="utf-8") if ag.exists() else ""
    if "spec-first" not in cur:
        ag.write_text((cur.rstrip() + "\n\n" if cur else "") + snip, encoding="utf-8")
        print("protocolo adicionado ao AGENTS.md")
        print("se usa Gemini/Antigravity/outro: crie GEMINI.md (ou o arquivo do agente) com "
              "'Siga o protocolo spec-first do AGENTS.md.'")
    print(f"criado {d}/ (porte {a.porte}). Próximos: packs list, packs add <...>, dominio <nome> <PREF>")


def cmd_dominio(a):
    d = Path(a.dir)
    if not re.fullmatch(r"[a-z][a-z0-9-]*", a.nome):
        sys.exit("nome: minúsculas, números e hífen")
    if not re.fullmatch(r"[A-Z]{2,6}", a.prefixo):
        sys.exit("prefixo: 2-6 letras maiúsculas")
    f = d / "dominios" / f"{a.nome}.yaml"
    if f.exists():
        sys.exit(f"{f} já existe")
    f.parent.mkdir(parents=True, exist_ok=True)
    t = (SKILL / "templates" / "dominio.yaml").read_text(encoding="utf-8")
    f.write_text(t.replace("{{nome}}", a.nome).replace("{{PREFIXO}}", a.prefixo), encoding="utf-8")
    sp = d / "spec.yaml"
    txt = sp.read_text(encoding="utf-8")
    m = re.search(r"^dominios:\s*\[(.*?)\]", txt, re.M)
    if m:
        cur = [x.strip() for x in m.group(1).split(",") if x.strip()]
        if a.nome not in cur:
            cur.append(a.nome)
        txt = txt[:m.start()] + f"dominios: [{', '.join(cur)}]" + txt[m.end():]
        sp.write_text(txt, encoding="utf-8")
    else:
        print(f"adicione '{a.nome}' em dominios: no spec.yaml")
    print(f"criado {f}")


def cmd_packs(a):
    d = Path(a.dir)
    if a.acao == "add":
        if not a.nomes:
            sys.exit("informe os packs: packs add auth lgpd")
        return add_packs(d, a.nomes)
    ck = d / "checklist.yaml"
    ctext = ck.read_text(encoding="utf-8") if ck.exists() else ""
    for n, p in packs_available().items():
        st = "no checklist" if re.search(rf"^{re.escape(n)}\.\d{{2}}:", ctext, re.M) else "-"
        print(f"{n:13} [{''.join(p['decisao_obrigatoria'])}] {p['quando']}  ({st})")


# ---------- report ----------
def cmd_report(a):
    d = Path(a.dir)
    E, W, st = run_check(d)
    spec = yaml.safe_load((d / "spec.yaml").read_text(encoding="utf-8"))
    L = [f"# Spec (gerado; não edite)\n", f"**{spec.get('visao')}**  (porte {spec.get('porte')})\n"]
    L.append("**Usuários:** " + "; ".join(f"{k}: {v}" for k, v in (spec.get("usuarios") or {}).items()))
    L.append("\n**Escopo:** " + "; ".join(spec.get("escopo") or []))
    L.append("\n**Fora de escopo:** " + "; ".join(spec.get("fora_de_escopo") or []))
    for name in spec.get("dominios") or []:
        f = d / "dominios" / f"{name}.yaml"
        if not f.exists():
            continue
        dom = yaml.safe_load(f.read_text(encoding="utf-8")) or {}
        L.append(f"\n## {name} ({dom.get('prefixo')}) - {dom.get('resumo')}")
        for en, c in (dom.get("entidades") or {}).items():
            L.append(f"- **{en}**: {', '.join(map(str, c))}")
        if isinstance(dom.get("estados"), dict):
            for en, fl in dom["estados"].items():
                L.append(f"- Estados {en}: {fl}")
        for rid, t in (dom.get("regras") or {}).items():
            L.append(f"- `{rid}` {t}")
    if spec.get("nao_funcionais"):
        L.append("\n## Não funcionais")
        L += [f"- `{k}` {v}" for k, v in spec["nao_funcionais"].items()]
    if spec.get("premissas"):
        L.append("\n## Premissas (assumidas, não confirmadas)")
        L += [f"- `{k}` {v}" for k, v in spec["premissas"].items()]
    L.append(f"\n---\nStatus do portão: {'OK' if not E else f'{len(E)} problema(s) abertos'}")
    (d / "SPEC.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    print(f"gerado {d}/SPEC.md")


# ---------- trace ----------
IGNORE = {".git", "node_modules", "spec", ".venv", "venv", "__pycache__", "dist", "build",
          ".next", "target", ".idea", ".vscode", "coverage"}
TEST_DIRS = {"test", "tests", "__tests__", "e2e", "spec_tests"}
TEST_NAME = re.compile(r"(^test_|_test\.|\.test\.|\.spec\.|_spec\.|Tests?\.(java|cs|kt)$)")


def is_test(p):
    return bool(TEST_DIRS & set(p.parts)) or bool(TEST_NAME.search(p.name))


def cmd_trace(a):
    d = Path(a.dir)
    E, _, _ = [], None, None
    rules, prefixes = {}, set()
    spec = safe_load(d / "spec.yaml", E) if (d / "spec.yaml").exists() else None
    if not spec:
        sys.exit("spec/spec.yaml ausente ou inválido")
    for name in spec.get("dominios") or []:
        f = d / "dominios" / f"{name}.yaml"
        if f.exists():
            dom = safe_load(f, E) or {}
            prefixes.add(dom.get("prefixo"))
            for rid in (dom.get("regras") or {}):
                rules[str(rid)] = name
    skip = {d.resolve(), SKILL}
    code, tests, orphans = defaultdict(set), defaultdict(set), defaultdict(set)
    for root in a.src or ["."]:
        for dp, dns, fns in os.walk(root):
            dns[:] = [x for x in dns if x not in IGNORE and (Path(dp) / x).resolve() not in skip]
            for fn in fns:
                p = Path(dp) / fn
                try:
                    if p.stat().st_size > 1_000_000:
                        continue
                    raw = p.read_bytes()
                except OSError:
                    continue
                if b"\0" in raw[:1024]:
                    continue
                for rid in set(RULE_RE.findall(raw.decode("utf-8", "ignore"))):
                    if rid in rules:
                        (tests if is_test(p) else code)[rid].add(str(p))
                    elif rid.split("-")[0] in prefixes:
                        orphans[rid].add(str(p))
    gaps = 0
    print(f"{len(rules)} regras na spec")
    for rid in sorted(rules):
        miss = []
        if rid not in code:
            miss.append("sem código")
        if rid not in tests:
            miss.append("sem teste")
        if miss:
            gaps += 1
            print(f"  {rid:10} {' | '.join(miss)}   ({rules[rid]})")
    for rid, fs in sorted(orphans.items()):
        gaps += 1
        print(f"  {rid:10} órfã: citada no código mas inexistente na spec ({sorted(fs)[0]})")
    if gaps == 0:
        print("cobertura completa: toda regra tem código e teste")
    else:
        print(f"{gaps} lacuna(s)")
        if a.strict:
            sys.exit(1)


def main():
    ap = argparse.ArgumentParser(prog="check.py", description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dir", default="spec", help="pasta da spec (padrão: spec)")
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--dir", default=argparse.SUPPRESS)
    sub = ap.add_subparsers(dest="cmd", required=True)
    i = sub.add_parser("init", parents=[common])
    i.add_argument("porte", choices=list("PMG"))
    dm = sub.add_parser("dominio", parents=[common])
    dm.add_argument("nome")
    dm.add_argument("prefixo")
    pk = sub.add_parser("packs", parents=[common])
    pk.add_argument("acao", choices=["list", "add"])
    pk.add_argument("nomes", nargs="*")
    c = sub.add_parser("check", parents=[common])
    c.add_argument("--plan", action="store_true", help="exige tarefas.yaml cobrindo todas as regras")
    sub.add_parser("report", parents=[common])
    t = sub.add_parser("trace", parents=[common])
    t.add_argument("--src", nargs="*")
    t.add_argument("--strict", action="store_true")
    a = ap.parse_args()
    {"init": cmd_init, "dominio": cmd_dominio, "packs": cmd_packs, "check": cmd_check,
     "report": cmd_report, "trace": cmd_trace}[a.cmd](a)


if __name__ == "__main__":
    main()
