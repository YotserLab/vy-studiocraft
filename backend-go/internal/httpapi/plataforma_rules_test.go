package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"regexp"
	"testing"
	"time"

	"vystudiocraft/internal/store"
)

// plaSignup cria um usuário e devolve (userID, cookies de sessão, token).
func plaSignup(t *testing.T, srv *Server, email string) (string, []*http.Cookie, string) {
	t.Helper()
	rec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", map[string]any{
		"email": email, "password": "Password123", "name": "User " + email,
	}, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("signup %s falhou: %d %s", email, rec.Code, rec.Body.String())
	}
	var out struct {
		User  store.User `json:"user"`
		Token string     `json:"token"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatalf("decode signup: %v", err)
	}
	return out.User.ID, rec.Result().Cookies(), out.Token
}

// plaDoc decodifica um store.Doc da resposta.
func plaDoc(t *testing.T, rec *httptest.ResponseRecorder) store.Doc {
	t.Helper()
	var d store.Doc
	if err := json.Unmarshal(rec.Body.Bytes(), &d); err != nil {
		t.Fatalf("decode doc falhou: %v (%s)", err, rec.Body.String())
	}
	return d
}

func plaListDocs(t *testing.T, rec *httptest.ResponseRecorder) []store.Doc {
	t.Helper()
	var out struct {
		Docs []store.Doc `json:"docs"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatalf("decode lista falhou: %v (%s)", err, rec.Body.String())
	}
	return out.Docs
}

// PLA-R02: path de documento alterna coleção/doc; segmentos ímpares endereçam coleções.
func TestPla_PathAlternatesCollectionDoc_PLA_R02(t *testing.T) {
	srv, _ := newTestServer(t, true)
	plaSignup(t, srv, "adm-r02@x.local") // bootstrap admin
	uid, cookies, _ := plaSignup(t, srv, "r02@x.local")
	h := srv.Handler()

	// 2 segmentos = documento: GET/PUT válidos
	getDoc := reqJSON(h, "GET", "/api/v1/fs/usuarios/"+uid, nil, cookies)
	if getDoc.Code != http.StatusOK {
		t.Fatalf("GET doc 2 segmentos: esperado 200, obtido %d", getDoc.Code)
	}
	if d := plaDoc(t, getDoc); d.Exists {
		t.Fatalf("doc novo deveria vir com exists=false")
	}
	putDoc := reqJSON(h, "PUT", "/api/v1/fs/usuarios/"+uid, map[string]any{
		"data": map[string]any{"nome": "x"},
	}, cookies)
	if putDoc.Code != http.StatusOK {
		t.Fatalf("PUT doc 2 segmentos: esperado 200, obtido %d", putDoc.Code)
	}

	// 3 segmentos = coleção: GET lista e POST cria
	getColl := reqJSON(h, "GET", "/api/v1/fs/usuarios/"+uid+"/projetos", nil, cookies)
	if getColl.Code != http.StatusOK {
		t.Fatalf("GET coleção 3 segmentos: esperado 200, obtido %d", getColl.Code)
	}
	post := reqJSON(h, "POST", "/api/v1/fs/usuarios/"+uid+"/projetos", map[string]any{
		"data": map[string]any{"t": "p1"},
	}, cookies)
	if post.Code != http.StatusCreated {
		t.Fatalf("POST coleção: esperado 201, obtido %d", post.Code)
	}

	// Paridade invertida é rejeitada: POST em path de doc / PUT+PATCH+DELETE em coleção
	if rec := reqJSON(h, "POST", "/api/v1/fs/usuarios/"+uid, map[string]any{"data": map[string]any{}}, cookies); rec.Code != http.StatusBadRequest {
		t.Fatalf("POST em path par: esperado 400, obtido %d", rec.Code)
	}
	for _, m := range []string{"PUT", "PATCH", "DELETE"} {
		if rec := reqJSON(h, m, "/api/v1/fs/usuarios/"+uid+"/projetos", map[string]any{"data": map[string]any{}}, cookies); rec.Code != http.StatusBadRequest {
			t.Fatalf("%s em path ímpar: esperado 400, obtido %d", m, rec.Code)
		}
	}
}

// PLA-R03: admin lê e escreve qualquer documento, coleção e arquivo.
func TestPla_AdminFullAccess_PLA_R03(t *testing.T) {
	srv, _ := newTestServer(t, true)
	_, admCookies, _ := plaSignup(t, srv, "admin@vystudiocraft.local") // bootstrap = admin
	uid, _, _ := plaSignup(t, srv, "r03@x.local")
	h := srv.Handler()

	// Escreve doc e coleção de outro usuário
	put := reqJSON(h, "PUT", "/api/v1/fs/usuarios/"+uid+"/docs/privado", map[string]any{
		"data": map[string]any{"segredo": 1},
	}, admCookies)
	if put.Code != http.StatusOK {
		t.Fatalf("admin PUT doc alheio: esperado 200, obtido %d", put.Code)
	}
	get := reqJSON(h, "GET", "/api/v1/fs/usuarios/"+uid+"/docs/privado", nil, admCookies)
	if get.Code != http.StatusOK || !plaDoc(t, get).Exists {
		t.Fatalf("admin GET doc alheio: %d", get.Code)
	}
	list := reqJSON(h, "GET", "/api/v1/fs/usuarios/"+uid+"/projetos", nil, admCookies)
	if list.Code != http.StatusOK {
		t.Fatalf("admin lista coleção alheia: esperado 200, obtido %d", list.Code)
	}
	// Escreve em raízes restritas a usuários comuns (paths com segmentos pares = docs)
	for _, p := range []string{"planos/p1", "aulas/a1", "membros/" + uid, "raizqualquer/d1"} {
		if rec := reqJSON(h, "PUT", "/api/v1/fs/"+p, map[string]any{"data": map[string]any{"x": 1}}, admCookies); rec.Code != http.StatusOK {
			t.Fatalf("admin PUT %s: esperado 200, obtido %d", p, rec.Code)
		}
	}
	// Lista coleção raiz "usuarios" (vedada a não-admin)
	if rec := reqJSON(h, "GET", "/api/v1/fs/usuarios", nil, admCookies); rec.Code != http.StatusOK {
		t.Fatalf("admin GET coleção usuarios: esperado 200, obtido %d", rec.Code)
	}
	// Admin apaga qualquer doc
	del := reqJSON(h, "DELETE", "/api/v1/fs/usuarios/"+uid+"/docs/privado", nil, admCookies)
	if del.Code != http.StatusOK {
		t.Fatalf("admin DELETE: esperado 200, obtido %d", del.Code)
	}
}

// PLA-R04: não-admin só lê/escreve sob usuarios/{seu-uid}/; planos e aulas são leitura autenticada.
func TestPla_UserIsolation_PLA_R04(t *testing.T) {
	srv, _ := newTestServer(t, true)
	plaSignup(t, srv, "r04adm@x.local") // bootstrap admin — não usar para isolamento
	uidB, cookiesB, _ := plaSignup(t, srv, "r04b@x.local")
	_, cookiesC, _ := plaSignup(t, srv, "r04c@x.local")
	h := srv.Handler()

	// B escreve e lê o próprio namespace (doc = número par de segmentos)
	docB := "/api/v1/fs/usuarios/" + uidB + "/docs/d1"
	if rec := reqJSON(h, "PUT", docB, map[string]any{"data": map[string]any{"v": 1}}, cookiesB); rec.Code != http.StatusOK {
		t.Fatalf("PUT próprio: esperado 200, obtido %d", rec.Code)
	}
	if rec := reqJSON(h, "GET", docB, nil, cookiesB); rec.Code != http.StatusOK {
		t.Fatalf("GET próprio: esperado 200, obtido %d", rec.Code)
	}

	// C não acessa nada sob usuarios/{uidB}
	for _, tc := range []struct {
		method, path string
	}{
		{"GET", "/api/v1/fs/usuarios/" + uidB + "/docs/d1"},
		{"PUT", "/api/v1/fs/usuarios/" + uidB + "/docs/d2"},
		{"PATCH", "/api/v1/fs/usuarios/" + uidB + "/docs/d1"},
		{"DELETE", "/api/v1/fs/usuarios/" + uidB + "/docs/d1"},
		{"GET", "/api/v1/fs/usuarios/" + uidB + "/projetos"},
		{"POST", "/api/v1/fs/usuarios/" + uidB + "/projetos"},
	} {
		body := any(nil)
		if tc.method != "GET" && tc.method != "DELETE" {
			body = map[string]any{"data": map[string]any{"v": 2}}
		}
		if rec := reqJSON(h, tc.method, tc.path, body, cookiesC); rec.Code != http.StatusForbidden {
			t.Fatalf("%s %s por terceiro: esperado 403, obtido %d", tc.method, tc.path, rec.Code)
		}
	}

	// planos e aulas: leitura autenticada, escrita proibida
	for _, p := range []string{"planos/p1", "aulas/a1"} {
		if rec := reqJSON(h, "GET", "/api/v1/fs/"+p, nil, cookiesB); rec.Code != http.StatusOK {
			t.Fatalf("GET %s autenticado: esperado 200, obtido %d", p, rec.Code)
		}
		if rec := reqJSON(h, "PUT", "/api/v1/fs/"+p, map[string]any{"data": map[string]any{"x": 1}}, cookiesB); rec.Code != http.StatusForbidden {
			t.Fatalf("PUT %s não-admin: esperado 403, obtido %d", p, rec.Code)
		}
	}
	for _, coll := range []string{"planos", "aulas"} {
		if rec := reqJSON(h, "GET", "/api/v1/fs/"+coll, nil, cookiesB); rec.Code != http.StatusOK {
			t.Fatalf("GET coleção %s: esperado 200, obtido %d", coll, rec.Code)
		}
	}
	// Raiz desconhecida: nem leitura
	if rec := reqJSON(h, "GET", "/api/v1/fs/secreto/doc", nil, cookiesB); rec.Code != http.StatusForbidden {
		t.Fatalf("GET raiz desconhecida: esperado 403, obtido %d", rec.Code)
	}
}

// PLA-R06: membros/{uid} só pode ser escrito pelo próprio dono do uid.
func TestPla_MembrosOwnerOnly_PLA_R06(t *testing.T) {
	srv, _ := newTestServer(t, true)
	_, _, _ = plaSignup(t, srv, "r06adm@x.local") // bootstrap admin
	uidB, cookiesB, _ := plaSignup(t, srv, "r06b@x.local")
	_, cookiesC, _ := plaSignup(t, srv, "r06c@x.local")
	h := srv.Handler()

	if rec := reqJSON(h, "PUT", "/api/v1/fs/membros/"+uidB, map[string]any{"data": map[string]any{"bio": "b"}}, cookiesB); rec.Code != http.StatusOK {
		t.Fatalf("dono PUT membros/{uid}: esperado 200, obtido %d", rec.Code)
	}
	if rec := reqJSON(h, "PUT", "/api/v1/fs/membros/"+uidB, map[string]any{"data": map[string]any{"bio": "c"}}, cookiesC); rec.Code != http.StatusForbidden {
		t.Fatalf("terceiro PUT membros/{uid}: esperado 403, obtido %d", rec.Code)
	}
	if rec := reqJSON(h, "DELETE", "/api/v1/fs/membros/"+uidB, nil, cookiesC); rec.Code != http.StatusForbidden {
		t.Fatalf("terceiro DELETE membros/{uid}: esperado 403, obtido %d", rec.Code)
	}
	// membros/{uid}/... (len > 2) não é permitido nem ao dono pela regra atual
	if rec := reqJSON(h, "PUT", "/api/v1/fs/membros/"+uidB+"/sub/doc", map[string]any{"data": map[string]any{}}, cookiesB); rec.Code != http.StatusForbidden {
		t.Fatalf("PUT membros/{uid}/sub/doc: esperado 403, obtido %d", rec.Code)
	}
}

// PLA-R11: listagem aceita where campo|op|valor, orderBy campo[:desc] e limit>0.
func TestPla_ListWhereOrderLimit_PLA_R11(t *testing.T) {
	srv, _ := newTestServer(t, true)
	_, _, _ = plaSignup(t, srv, "r11adm@x.local")
	uid, cookies, _ := plaSignup(t, srv, "r11@x.local")
	h := srv.Handler()
	coll := "/api/v1/fs/usuarios/" + uid + "/projetos"

	for _, v := range []int{30, 10, 20} {
		rec := reqJSON(h, "POST", coll, map[string]any{"data": map[string]any{"views": v, "titulo": "p"}}, cookies)
		if rec.Code != http.StatusCreated {
			t.Fatalf("setup POST falhou: %d", rec.Code)
		}
	}

	// where numérico
	rec := reqJSON(h, "GET", coll+"?where="+url.QueryEscape("views|>|10"), nil, cookies)
	docs := plaListDocs(t, rec)
	if len(docs) != 2 {
		t.Fatalf("where views>10: esperado 2 docs, obtido %d", len(docs))
	}
	// where igualdade em campo string
	rec = reqJSON(h, "GET", coll+"?where="+url.QueryEscape("titulo|==|p"), nil, cookies)
	if docs = plaListDocs(t, rec); len(docs) != 3 {
		t.Fatalf("where titulo==p: esperado 3 docs, obtido %d", len(docs))
	}
	// orderBy asc
	rec = reqJSON(h, "GET", coll+"?orderBy=views", nil, cookies)
	docs = plaListDocs(t, rec)
	if len(docs) != 3 || docs[0].Data["views"] != float64(10) || docs[2].Data["views"] != float64(30) {
		t.Fatalf("orderBy asc falhou: %+v", docs)
	}
	// orderBy desc
	rec = reqJSON(h, "GET", coll+"?orderBy=views:desc", nil, cookies)
	docs = plaListDocs(t, rec)
	if len(docs) != 3 || docs[0].Data["views"] != float64(30) || docs[2].Data["views"] != float64(10) {
		t.Fatalf("orderBy desc falhou: %+v", docs)
	}
	// limit
	rec = reqJSON(h, "GET", coll+"?orderBy=views&limit=1", nil, cookies)
	if docs = plaListDocs(t, rec); len(docs) != 1 || docs[0].Data["views"] != float64(10) {
		t.Fatalf("limit falhou: %+v", docs)
	}
	// where + orderBy + limit combinados
	rec = reqJSON(h, "GET", coll+"?where="+url.QueryEscape("views|>=|10")+"&orderBy=views:desc&limit=2", nil, cookies)
	docs = plaListDocs(t, rec)
	if len(docs) != 2 || docs[0].Data["views"] != float64(30) || docs[1].Data["views"] != float64(20) {
		t.Fatalf("combinação where+orderBy+limit falhou: %+v", docs)
	}
}

// PLA-R16: setDoc com merge:true faz merge profundo; sem merge o documento é substituído.
func TestPla_MergeDeepVsReplace_PLA_R16(t *testing.T) {
	srv, _ := newTestServer(t, true)
	plaSignup(t, srv, "adm-r16@x.local") // bootstrap admin
	uid, cookies, _ := plaSignup(t, srv, "r16@x.local")
	h := srv.Handler()
	p := "/api/v1/fs/usuarios/" + uid + "/cfg/main" // 4 segmentos = doc

	reqJSON(h, "PUT", p, map[string]any{"data": map[string]any{
		"a": 1, "nested": map[string]any{"x": 1, "y": 2},
	}}, cookies)

	// merge:true preserva e mescla profundamente
	rec := reqJSON(h, "PUT", p, map[string]any{
		"data":  map[string]any{"nested": map[string]any{"y": 3, "z": 4}},
		"merge": true,
	}, cookies)
	if rec.Code != http.StatusOK {
		t.Fatalf("PUT merge: %d", rec.Code)
	}
	d := plaDoc(t, rec)
	nested, _ := d.Data["nested"].(map[string]any)
	if d.Data["a"] != float64(1) || nested["x"] != float64(1) || nested["y"] != float64(3) || nested["z"] != float64(4) {
		t.Fatalf("merge profundo incorreto: %+v", d.Data)
	}

	// sem merge o documento é substituído por completo
	rec = reqJSON(h, "PUT", p, map[string]any{"data": map[string]any{"b": 9}}, cookies)
	d = plaDoc(t, rec)
	if len(d.Data) != 1 || d.Data["b"] != float64(9) {
		t.Fatalf("PUT sem merge deveria substituir o doc: %+v", d.Data)
	}
}

// PLA-R17: sentinels __del apaga campo, __svts grava timestamp do servidor, __inc soma.
func TestPla_Sentinels_PLA_R17(t *testing.T) {
	srv, _ := newTestServer(t, true)
	plaSignup(t, srv, "adm-r17@x.local") // bootstrap admin
	uid, cookies, _ := plaSignup(t, srv, "r17@x.local")
	h := srv.Handler()
	p := "/api/v1/fs/usuarios/" + uid + "/contadores/c1" // 4 segmentos = doc

	reqJSON(h, "PUT", p, map[string]any{"data": map[string]any{
		"apagar": "x", "manter": 1, "n": 5,
	}}, cookies)

	before := time.Now().UnixMilli()
	rec := reqJSON(h, "PUT", p, map[string]any{
		"data": map[string]any{
			"apagar": map[string]any{"__del": true},
			"ts":     map[string]any{"__svts": true},
			"n":      map[string]any{"__inc": 3},
			"novo":   map[string]any{"__inc": 2},
		},
		"merge": true,
	}, cookies)
	after := time.Now().UnixMilli()
	if rec.Code != http.StatusOK {
		t.Fatalf("PUT sentinels: %d %s", rec.Code, rec.Body.String())
	}
	d := plaDoc(t, rec)
	if _, ok := d.Data["apagar"]; ok {
		t.Fatalf("__del deveria remover o campo: %+v", d.Data)
	}
	if d.Data["manter"] != float64(1) {
		t.Fatalf("campo não tocado deveria ser preservado: %+v", d.Data)
	}
	if d.Data["n"] != float64(8) {
		t.Fatalf("__inc 3 sobre 5 deveria dar 8: %+v", d.Data)
	}
	if d.Data["novo"] != float64(2) {
		t.Fatalf("__inc em campo inexistente deveria partir de 0: %+v", d.Data)
	}
	ts, ok := d.Data["ts"].(float64)
	if !ok || int64(ts) < before-1000 || int64(ts) > after+1000 {
		t.Fatalf("__svts deveria gravar timestamp do servidor (~%d): %v", before, d.Data["ts"])
	}
}

// PLA-R18: GET em documento inexistente retorna exists:false e HTTP 200.
func TestPla_GetMissingDoc_PLA_R18(t *testing.T) {
	srv, _ := newTestServer(t, true)
	plaSignup(t, srv, "adm-r18@x.local") // bootstrap admin
	uid, cookies, _ := plaSignup(t, srv, "r18@x.local")
	rec := reqJSON(srv.Handler(), "GET", "/api/v1/fs/usuarios/"+uid+"/projetos/inexistente", nil, cookies)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET doc inexistente: esperado 200, obtido %d", rec.Code)
	}
	d := plaDoc(t, rec)
	if d.Exists || d.ID != "inexistente" || d.Path != "usuarios/"+uid+"/projetos/inexistente" {
		t.Fatalf("doc inexistente deveria vir exists=false com id/path preenchidos: %+v", d)
	}
	if len(d.Data) != 0 {
		t.Fatalf("data deveria ser objeto vazio: %+v", d.Data)
	}
}

// PLA-R19: ids de docs criados via POST são tokens aleatórios authx.Token(8) — 16 chars hex.
func TestPla_CreateRandomIDs_PLA_R19(t *testing.T) {
	srv, _ := newTestServer(t, true)
	plaSignup(t, srv, "adm-r19@x.local") // bootstrap admin
	uid, cookies, _ := plaSignup(t, srv, "r19@x.local")
	coll := "/api/v1/fs/usuarios/" + uid + "/projetos"

	hexRe := regexp.MustCompile(`^[0-9a-f]{16}$`)
	seen := map[string]bool{}
	for i := 0; i < 3; i++ {
		rec := reqJSON(srv.Handler(), "POST", coll, map[string]any{"data": map[string]any{"i": i}}, cookies)
		if rec.Code != http.StatusCreated {
			t.Fatalf("POST create: %d", rec.Code)
		}
		d := plaDoc(t, rec)
		if !hexRe.MatchString(d.ID) {
			t.Fatalf("id %q não é token hex de 16 chars (authx.Token(8))", d.ID)
		}
		if d.Path != "usuarios/"+uid+"/projetos/"+d.ID {
			t.Fatalf("path não corresponde a coll/id: %q", d.Path)
		}
		if seen[d.ID] {
			t.Fatalf("id duplicado %q — deveria ser aleatório", d.ID)
		}
		seen[d.ID] = true
	}
}

// PLA-R20: permissões avaliadas pela raiz do path; subcoleções herdam a regra do nível superior.
func TestPla_SubcollectionInheritsRoot_PLA_R20(t *testing.T) {
	srv, _ := newTestServer(t, true)
	_, _, _ = plaSignup(t, srv, "r20adm@x.local")
	uidB, cookiesB, _ := plaSignup(t, srv, "r20b@x.local")
	_, cookiesC, _ := plaSignup(t, srv, "r20c@x.local")
	h := srv.Handler()

	// Dono escreve/lê em subcoleção profunda sob seu uid
	sub := "usuarios/" + uidB + "/projetos/p1/tarefas/t1"
	if rec := reqJSON(h, "PUT", "/api/v1/fs/"+sub, map[string]any{"data": map[string]any{"ok": true}}, cookiesB); rec.Code != http.StatusOK {
		t.Fatalf("PUT subcoleção própria: esperado 200, obtido %d", rec.Code)
	}
	if rec := reqJSON(h, "GET", "/api/v1/fs/"+sub, nil, cookiesB); rec.Code != http.StatusOK || !plaDoc(t, rec).Exists {
		t.Fatalf("GET subcoleção própria falhou: %d", rec.Code)
	}
	if rec := reqJSON(h, "GET", "/api/v1/fs/usuarios/"+uidB+"/projetos/p1/tarefas", nil, cookiesB); rec.Code != http.StatusOK {
		t.Fatalf("list subcoleção própria: esperado 200, obtido %d", rec.Code)
	}

	// Terceiro não herda nada sob usuarios/{outro}
	if rec := reqJSON(h, "PUT", "/api/v1/fs/"+sub, map[string]any{"data": map[string]any{}}, cookiesC); rec.Code != http.StatusForbidden {
		t.Fatalf("PUT subcoleção alheia: esperado 403, obtido %d", rec.Code)
	}
	if rec := reqJSON(h, "GET", "/api/v1/fs/"+sub, nil, cookiesC); rec.Code != http.StatusForbidden {
		t.Fatalf("GET subcoleção alheia: esperado 403, obtido %d", rec.Code)
	}
	if rec := reqJSON(h, "GET", "/api/v1/fs/usuarios/"+uidB+"/projetos/p1/tarefas", nil, cookiesC); rec.Code != http.StatusForbidden {
		t.Fatalf("list subcoleção alheia: esperado 403, obtido %d", rec.Code)
	}

	// planos: leitura herda, escrita não
	if rec := reqJSON(h, "GET", "/api/v1/fs/planos/p1/itens/i1", nil, cookiesB); rec.Code != http.StatusOK {
		t.Fatalf("GET subdoc de planos: esperado 200, obtido %d", rec.Code)
	}
	if rec := reqJSON(h, "PUT", "/api/v1/fs/planos/p1/itens/i1", map[string]any{"data": map[string]any{}}, cookiesB); rec.Code != http.StatusForbidden {
		t.Fatalf("PUT subdoc de planos: esperado 403, obtido %d", rec.Code)
	}
}

// PLA-R21: POST, PUT, PATCH e DELETE em docs publicam evento SSE com o path alterado.
func TestPla_WritesPublishEvents_PLA_R21(t *testing.T) {
	srv, db := newTestServer(t, true)
	plaSignup(t, srv, "adm-r21@x.local") // bootstrap admin
	uid, cookies, _ := plaSignup(t, srv, "r21@x.local")
	h := srv.Handler()

	ch, unsub := db.Subscribe()
	defer unsub()

	expectEvent := func(want string) {
		t.Helper()
		select {
		case got := <-ch:
			if got != want {
				t.Fatalf("evento SSE path=%q, esperado %q", got, want)
			}
		case <-time.After(3 * time.Second):
			t.Fatalf("timeout esperando evento SSE para %q", want)
		}
	}

	docPath := "usuarios/" + uid + "/cfg/main" // doc = segmentos pares

	// PUT
	rec := reqJSON(h, "PUT", "/api/v1/fs/"+docPath, map[string]any{"data": map[string]any{"v": 1}}, cookies)
	if rec.Code != http.StatusOK {
		t.Fatalf("PUT: %d", rec.Code)
	}
	expectEvent(docPath)

	// POST (create em coleção emite coll/{id})
	rec = reqJSON(h, "POST", "/api/v1/fs/usuarios/"+uid+"/projetos", map[string]any{"data": map[string]any{}}, cookies)
	if rec.Code != http.StatusCreated {
		t.Fatalf("POST: %d", rec.Code)
	}
	created := plaDoc(t, rec)
	expectEvent(created.Path)

	// PATCH
	rec = reqJSON(h, "PATCH", "/api/v1/fs/"+docPath, map[string]any{"data": map[string]any{"v": 2}}, cookies)
	if rec.Code != http.StatusOK {
		t.Fatalf("PATCH: %d", rec.Code)
	}
	expectEvent(docPath)

	// DELETE
	rec = reqJSON(h, "DELETE", "/api/v1/fs/"+docPath, nil, cookies)
	if rec.Code != http.StatusOK {
		t.Fatalf("DELETE: %d", rec.Code)
	}
	expectEvent(docPath)

	// DELETE de doc inexistente não emite (RowsAffected=0)
	rec = reqJSON(h, "DELETE", "/api/v1/fs/"+docPath, nil, cookies)
	if rec.Code != http.StatusOK {
		t.Fatalf("DELETE inexistente: %d", rec.Code)
	}
	select {
	case got := <-ch:
		t.Fatalf("delete sem efeito não deveria emitir evento, recebido %q", got)
	case <-time.After(300 * time.Millisecond):
	}
}
