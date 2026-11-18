package httpapi

import (
	"bufio"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"

	"vystudiocraft/internal/store"
)

// tfSignup cria um usuário e devolve (userID, cookies de sessão, token).
func tfSignup(t *testing.T, srv *Server, email string) (string, []*http.Cookie, string) {
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

// tfRaw envia request com body binário, Content-Type e headers arbitrários.
func tfRaw(t *testing.T, srv *Server, method, target, contentType string, body []byte, cookies []*http.Cookie, headers map[string]string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, target, bytes.NewReader(body))
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	for _, c := range cookies {
		req.AddCookie(c)
	}
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, req)
	return rec
}

func tfFileMeta(t *testing.T, rec *httptest.ResponseRecorder) store.FileMeta {
	t.Helper()
	var m store.FileMeta
	if err := json.Unmarshal(rec.Body.Bytes(), &m); err != nil {
		t.Fatalf("decode FileMeta falhou: %v (%s)", err, rec.Body.String())
	}
	return m
}

// TRN-R01: toda rota /api/v1/* de dados exige sessão válida; sem sessão retorna 401.
func TestTrn_DataRoutesRequireSession_TRN_R01(t *testing.T) {
	srv, _ := newTestServer(t, false)
	h := srv.Handler()

	for _, p := range []string{
		"/api/v1/auth/me",
		"/api/v1/auth/token",
		"/api/v1/fs/usuarios/abc/doc",
		"/api/v1/fs/usuarios/abc/projetos",
		"/api/v1/files",
		"/api/v1/fs/events?path=usuarios/abc",
	} {
		if rec := reqJSON(h, "GET", p, nil, nil); rec.Code != http.StatusUnauthorized {
			t.Fatalf("GET %s anônimo: esperado 401, obtido %d", p, rec.Code)
		}
	}
	if rec := tfRaw(t, srv, "PUT", "/api/v1/files/usuarios/abc/f.txt", "text/plain", []byte("x"), nil, nil); rec.Code != http.StatusUnauthorized {
		t.Fatalf("PUT files anônimo: esperado 401, obtido %d", rec.Code)
	}
	if rec := reqJSON(h, "DELETE", "/api/v1/fs/usuarios/abc/doc", nil, nil); rec.Code != http.StatusUnauthorized {
		t.Fatalf("DELETE fs anônimo: esperado 401, obtido %d", rec.Code)
	}
	// Token inválido também é 401
	rec := reqJSON(h, "GET", "/api/v1/auth/me?token=invalido", nil, nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("token inválido: esperado 401, obtido %d", rec.Code)
	}
}

// TRN-R02 + MID-R01: arquivos existem apenas sob usuarios/{uid}/; acesso ao próprio uid ou admin.
// Upload é PUT /api/v1/files/{path}.
func TestTrn_FilesOnlyUnderUsuarios_TRN_R02_MID_R01(t *testing.T) {
	srv, _ := newTestServer(t, true)
	_, admCookies, _ := tfSignup(t, srv, "admin@vystudiocraft.local")
	uidB, cookiesB, _ := tfSignup(t, srv, "r02b@x.local")
	_, cookiesC, _ := tfSignup(t, srv, "r02c@x.local")

	// Upload no próprio uid -> 201 com FileMeta
	rec := tfRaw(t, srv, "PUT", "/api/v1/files/usuarios/"+uidB+"/docs/nota.txt", "text/plain", []byte("oi"), cookiesB, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("upload próprio: esperado 201, obtido %d %s", rec.Code, rec.Body.String())
	}
	if m := tfFileMeta(t, rec); m.Path != "usuarios/"+uidB+"/docs/nota.txt" || m.UID != uidB {
		t.Fatalf("FileMeta inesperado: %+v", m)
	}

	// Upload fora de usuarios/ -> 403
	for _, p := range []string{
		"/api/v1/files/midia/f.txt",
		"/api/v1/files/" + uidB + "/f.txt",
		"/api/v1/files/usuarios",
	} {
		if rec := tfRaw(t, srv, "PUT", p, "text/plain", []byte("x"), cookiesB, nil); rec.Code != http.StatusForbidden {
			t.Fatalf("PUT %s: esperado 403, obtido %d", p, rec.Code)
		}
	}
	// Upload/get/delete no uid de outro -> 403
	if rec := tfRaw(t, srv, "PUT", "/api/v1/files/usuarios/"+uidB+"/x.txt", "text/plain", []byte("x"), cookiesC, nil); rec.Code != http.StatusForbidden {
		t.Fatalf("PUT uid alheio: esperado 403, obtido %d", rec.Code)
	}
	if rec := reqJSON(srv.Handler(), "GET", "/api/v1/files/usuarios/"+uidB+"/docs/nota.txt", nil, cookiesC); rec.Code != http.StatusForbidden {
		t.Fatalf("GET meta alheio: esperado 403, obtido %d", rec.Code)
	}
	if rec := reqJSON(srv.Handler(), "DELETE", "/api/v1/files/usuarios/"+uidB+"/docs/nota.txt", nil, cookiesC); rec.Code != http.StatusForbidden {
		t.Fatalf("DELETE alheio: esperado 403, obtido %d", rec.Code)
	}
	if rec := reqJSON(srv.Handler(), "GET", "/api/v1/files?prefix=usuarios/"+uidB, nil, cookiesC); rec.Code != http.StatusForbidden {
		t.Fatalf("list prefix alheio: esperado 403, obtido %d", rec.Code)
	}
	// Admin acessa uid de qualquer usuário
	if rec := tfRaw(t, srv, "PUT", "/api/v1/files/usuarios/"+uidB+"/adm.txt", "text/plain", []byte("a"), admCookies, nil); rec.Code != http.StatusCreated {
		t.Fatalf("admin PUT uid alheio: esperado 201, obtido %d", rec.Code)
	}
	if rec := reqJSON(srv.Handler(), "GET", "/api/v1/files/usuarios/"+uidB+"/docs/nota.txt", nil, admCookies); rec.Code != http.StatusOK {
		t.Fatalf("admin GET meta alheio: esperado 200, obtido %d", rec.Code)
	}
}

// TRN-R03: upload acima de UPLOAD_MAX_MB retorna 413.
func TestTrn_UploadLimit_TRN_R03(t *testing.T) {
	srv, _ := newTestServer(t, true)
	srv.cfg.UploadMaxMB = 1 // reduz o limite para o teste
	uid, cookies, _ := tfSignup(t, srv, "r03@x.local")

	big := bytes.Repeat([]byte("x"), 1*1024*1024+1)
	rec := tfRaw(t, srv, "PUT", "/api/v1/files/usuarios/"+uid+"/grande.bin", "application/octet-stream", big, cookies, nil)
	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("upload acima do limite: esperado 413, obtido %d", rec.Code)
	}
	small := tfRaw(t, srv, "PUT", "/api/v1/files/usuarios/"+uid+"/pequeno.bin", "application/octet-stream", []byte("ok"), cookies, nil)
	if small.Code != http.StatusCreated {
		t.Fatalf("upload abaixo do limite: esperado 201, obtido %d", small.Code)
	}
}

// TRN-R04 (+TRN-R08): /api/feed exige sessão, rejeita scheme != http(s), limita corpo a 2MB (413) e cacheia 5min.
func TestTrn_FeedProxy_TRN_R04 /* e NOT-R06: limites do proxy */(t *testing.T) {
	srv, _ := newTestServer(t, true)
	_, cookies, _ := tfSignup(t, srv, "r04@x.local")
	h := srv.Handler()

	var hits int32
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&hits, 1)
		if strings.Contains(r.URL.Path, "big") {
			_, _ = w.Write(make([]byte, feedMaxBytes+1))
			return
		}
		_, _ = w.Write([]byte("<rss version=\"2.0\"></rss>"))
	}))
	defer upstream.Close()

	// Scheme inválido -> 400
	if rec := reqJSON(h, "GET", "/api/feed?url=ftp://host/feed", nil, cookies); rec.Code != http.StatusBadRequest {
		t.Fatalf("feed scheme inválido: esperado 400, obtido %d", rec.Code)
	}
	if rec := reqJSON(h, "GET", "/api/feed?url=", nil, cookies); rec.Code != http.StatusBadRequest {
		t.Fatalf("feed sem url: esperado 400, obtido %d", rec.Code)
	}
	// Corpo > 2MB -> 413
	before := atomic.LoadInt32(&hits)
	rec := reqJSON(h, "GET", "/api/feed?url="+url.QueryEscape(upstream.URL+"/big.xml"), nil, cookies)
	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("feed >2MB: esperado 413, obtido %d", rec.Code)
	}
	if atomic.LoadInt32(&hits) != before+1 {
		t.Fatalf("upstream deveria ter sido chamado 1x")
	}
	// Feed pequeno -> 200 e resposta cacheada (segunda chamada não bate no upstream)
	rec = reqJSON(h, "GET", "/api/feed?url="+url.QueryEscape(upstream.URL+"/feed.xml"), nil, cookies)
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "<rss") {
		t.Fatalf("feed ok: %d %s", rec.Code, rec.Body.String())
	}
	if ct := rec.Header().Get("Content-Type"); !strings.Contains(ct, "xml") {
		t.Fatalf("content-type do feed: %q", ct)
	}
	hitsAfterFirst := atomic.LoadInt32(&hits)
	rec = reqJSON(h, "GET", "/api/feed?url="+url.QueryEscape(upstream.URL+"/feed.xml"), nil, cookies)
	if rec.Code != http.StatusOK {
		t.Fatalf("feed cacheado: %d", rec.Code)
	}
	if atomic.LoadInt32(&hits) != hitsAfterFirst {
		t.Fatalf("cache de 5min deveria evitar nova chamada ao upstream")
	}
}

// TRN-R05: SSE /api/v1/fs/events exige permissão de leitura no path.
func TestTrn_SSERequiresPathPermission_TRN_R05(t *testing.T) {
	srv, _ := newTestServer(t, true)
	tfSignup(t, srv, "admin@vystudiocraft.local")
	uidB, _, tokenB := tfSignup(t, srv, "r05b@x.local")
	_, cookiesC, _ := tfSignup(t, srv, "r05c@x.local")
	h := srv.Handler()

	// anônimo -> 401
	if rec := reqJSON(h, "GET", "/api/v1/fs/events?path=usuarios/"+uidB, nil, nil); rec.Code != http.StatusUnauthorized {
		t.Fatalf("SSE anônimo: esperado 401, obtido %d", rec.Code)
	}
	// sem permissão no path -> 403 (doc e coleção alheios)
	for _, p := range []string{"usuarios/" + uidB, "usuarios/" + uidB + "/projetos"} {
		if rec := reqJSON(h, "GET", "/api/v1/fs/events?path="+url.QueryEscape(p), nil, cookiesC); rec.Code != http.StatusForbidden {
			t.Fatalf("SSE path alheio %s: esperado 403, obtido %d", p, rec.Code)
		}
	}
	// path vazio exige admin
	if rec := reqJSON(h, "GET", "/api/v1/fs/events", nil, cookiesC); rec.Code != http.StatusForbidden {
		t.Fatalf("SSE path vazio não-admin: esperado 403, obtido %d", rec.Code)
	}

	// Com permissão -> stream abre com evento "connected" (sessão via ?token — TRN-R06)
	ts := httptest.NewServer(h)
	defer ts.Close()
	resp, err := ts.Client().Get(ts.URL + "/api/v1/fs/events?path=" + url.QueryEscape("usuarios/"+uidB) + "&token=" + tokenB)
	if err != nil {
		t.Fatalf("SSE request falhou: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("SSE permitido: esperado 200, obtido %d", resp.StatusCode)
	}
	if ct := resp.Header.Get("Content-Type"); !strings.Contains(ct, "text/event-stream") {
		t.Fatalf("SSE content-type: %q", ct)
	}
	line, err := bufio.NewReader(resp.Body).ReadString('\n')
	if err != nil || !strings.Contains(line, "connected") {
		t.Fatalf("primeiro evento SSE deveria ser 'connected': %q err=%v", line, err)
	}
}

// TRN-R06: sessão pode vir do cookie vysc_sess, header Bearer ou query ?token.
func TestTrn_SessionSources_TRN_R06(t *testing.T) {
	srv, _ := newTestServer(t, true)
	tfSignup(t, srv, "admin@vystudiocraft.local")
	_, cookies, token := tfSignup(t, srv, "r06@x.local")
	h := srv.Handler()

	// cookie
	if rec := reqJSON(h, "GET", "/api/v1/auth/me", nil, cookies); rec.Code != http.StatusOK {
		t.Fatalf("sessão via cookie: esperado 200, obtido %d", rec.Code)
	}
	// Bearer
	rec := tfRaw(t, srv, "GET", "/api/v1/auth/me", "", nil, nil, map[string]string{"Authorization": "Bearer " + token})
	if rec.Code != http.StatusOK {
		t.Fatalf("sessão via Bearer: esperado 200, obtido %d", rec.Code)
	}
	// ?token
	if rec := reqJSON(h, "GET", "/api/v1/auth/me?token="+token, nil, nil); rec.Code != http.StatusOK {
		t.Fatalf("sessão via ?token: esperado 200, obtido %d", rec.Code)
	}
	// Bearer inválido -> 401
	rec = tfRaw(t, srv, "GET", "/api/v1/auth/me", "", nil, nil, map[string]string{"Authorization": "Bearer invalido"})
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("Bearer inválido: esperado 401, obtido %d", rec.Code)
	}
}

// TRN-R07: rota /api/* desconhecida retorna 404 JSON; rota SPA desconhecida serve index.html com 404.
func TestTrn_UnknownRoutes_TRN_R07(t *testing.T) {
	srv, _ := newTestServer(t, false)
	h := srv.Handler()

	// /api/* desconhecido -> 404 JSON
	for _, p := range []string{"/api/v1/nao-existe", "/api/foo/bar"} {
		rec := reqJSON(h, "GET", p, nil, nil)
		if rec.Code != http.StatusNotFound {
			t.Fatalf("GET %s: esperado 404, obtido %d", p, rec.Code)
		}
		if ct := rec.Header().Get("Content-Type"); !strings.Contains(ct, "application/json") {
			t.Fatalf("GET %s: esperado JSON, obtido %q", p, ct)
		}
		var body map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil || body["error"] == nil {
			t.Fatalf("GET %s: corpo deveria ser JSON com error: %s", p, rec.Body.String())
		}
	}

	// Prepara index.html no WebDir do servidor de teste
	marker := "<html>SPA-INDEX-MARKER</html>"
	if err := os.WriteFile(filepath.Join(srv.cfg.WebDir, "index.html"), []byte(marker), 0o644); err != nil {
		t.Fatalf("escrever index.html: %v", err)
	}

	// Rota SPA desconhecida -> index.html com status 404
	rec := reqJSON(h, "GET", "/rota-totalmente-desconhecida", nil, nil)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("SPA desconhecida: esperado status 404, obtido %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "SPA-INDEX-MARKER") {
		t.Fatalf("SPA desconhecida deveria servir index.html: %s", rec.Body.String())
	}
	// Rota SPA conhecida -> index.html com 200
	rec = reqJSON(h, "GET", "/projetos", nil, nil)
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "SPA-INDEX-MARKER") {
		t.Fatalf("SPA conhecida: esperado 200 + index.html, obtido %d", rec.Code)
	}
}

// MID-R02: content_type usa ?ct=, depois Content-Type do request, senão application/octet-stream;
// nome vazio usa o último segmento do path.
func TestMid_ContentTypeAndName_MID_R02(t *testing.T) {
	srv, _ := newTestServer(t, true)
	tfSignup(t, srv, "admin@vystudiocraft.local")
	uid, cookies, _ := tfSignup(t, srv, "m02@x.local")
	base := "/api/v1/files/usuarios/" + uid

	// ?ct= tem precedência sobre o header
	rec := tfRaw(t, srv, "PUT", base+"/a.bin?ct=text/plain&name=rotulo.txt", "application/json", []byte("x"), cookies, nil)
	m := tfFileMeta(t, rec)
	if m.ContentType != "text/plain" || m.Name != "rotulo.txt" {
		t.Fatalf("?ct/?name deveriam ter precedência: %+v", m)
	}
	// Sem ?ct: usa Content-Type do request; sem ?name usa último segmento
	rec = tfRaw(t, srv, "PUT", base+"/foto.png", "image/png", []byte("x"), cookies, nil)
	m = tfFileMeta(t, rec)
	if m.ContentType != "image/png" || m.Name != "foto.png" {
		t.Fatalf("fallback Content-Type/name: %+v", m)
	}
	// Sem nada: application/octet-stream
	rec = tfRaw(t, srv, "PUT", base+"/sem-tipo", "", []byte("x"), cookies, nil)
	m = tfFileMeta(t, rec)
	if m.ContentType != "application/octet-stream" {
		t.Fatalf("fallback octet-stream: %+v", m)
	}
}

// MID-R03: GET /api/v1/files/{path} retorna metadados; ?download=1 ou sufixo /download serve o binário.
func TestMid_GetMetaAndDownload_MID_R03(t *testing.T) {
	srv, _ := newTestServer(t, true)
	tfSignup(t, srv, "admin@vystudiocraft.local")
	uid, cookies, _ := tfSignup(t, srv, "m03@x.local")
	p := "usuarios/" + uid + "/docs/arq.txt"

	rec := tfRaw(t, srv, "PUT", "/api/v1/files/"+p, "text/plain", []byte("conteudo-binario"), cookies, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("upload: %d", rec.Code)
	}

	// metadados
	meta := reqJSON(srv.Handler(), "GET", "/api/v1/files/"+p, nil, cookies)
	if meta.Code != http.StatusOK {
		t.Fatalf("GET meta: %d", meta.Code)
	}
	m := tfFileMeta(t, meta)
	if m.Name != "arq.txt" || m.Size != int64(len("conteudo-binario")) || m.URL == "" {
		t.Fatalf("meta incompleto: %+v", m)
	}
	// sufixo /meta equivale ao GET de metadados
	if rec := reqJSON(srv.Handler(), "GET", "/api/v1/files/"+p+"/meta", nil, cookies); rec.Code != http.StatusOK {
		t.Fatalf("GET .../meta: %d", rec.Code)
	}
	// ?download=1 serve o binário
	dl := tfRaw(t, srv, "GET", "/api/v1/files/"+p+"?download=1", "", nil, cookies, nil)
	if dl.Code != http.StatusOK || dl.Body.String() != "conteudo-binario" {
		t.Fatalf("download=1: %d %q", dl.Code, dl.Body.String())
	}
	// sufixo /download serve o binário
	dl2 := tfRaw(t, srv, "GET", "/api/v1/files/"+p+"/download", "", nil, cookies, nil)
	if dl2.Code != http.StatusOK || dl2.Body.String() != "conteudo-binario" {
		t.Fatalf(".../download: %d %q", dl2.Code, dl2.Body.String())
	}
	// arquivo inexistente -> 404
	if rec := reqJSON(srv.Handler(), "GET", "/api/v1/files/usuarios/"+uid+"/nada.txt", nil, cookies); rec.Code != http.StatusNotFound {
		t.Fatalf("GET inexistente: esperado 404, obtido %d", rec.Code)
	}
}

// MID-R04: DELETE /api/v1/files/{path} remove o metadado e apaga o arquivo do disco.
func TestMid_DeleteRemovesMetaAndDisk_MID_R04(t *testing.T) {
	srv, _ := newTestServer(t, true)
	tfSignup(t, srv, "admin@vystudiocraft.local")
	uid, cookies, _ := tfSignup(t, srv, "m04@x.local")
	p := "usuarios/" + uid + "/temp.txt"
	disk := filepath.Join(srv.cfg.DataDir, "files", filepath.FromSlash(p))

	rec := tfRaw(t, srv, "PUT", "/api/v1/files/"+p, "text/plain", []byte("tmp"), cookies, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("upload: %d", rec.Code)
	}
	if _, err := os.Stat(disk); err != nil {
		t.Fatalf("arquivo deveria existir em disco: %v", err)
	}
	del := reqJSON(srv.Handler(), "DELETE", "/api/v1/files/"+p, nil, cookies)
	if del.Code != http.StatusOK {
		t.Fatalf("DELETE: %d", del.Code)
	}
	var out struct {
		OK bool `json:"ok"`
	}
	_ = json.Unmarshal(del.Body.Bytes(), &out)
	if !out.OK {
		t.Fatalf("DELETE deveria retornar ok=true: %s", del.Body.String())
	}
	if rec := reqJSON(srv.Handler(), "GET", "/api/v1/files/"+p, nil, cookies); rec.Code != http.StatusNotFound {
		t.Fatalf("meta deveria ter sumido: %d", rec.Code)
	}
	if _, err := os.Stat(disk); !os.IsNotExist(err) {
		t.Fatalf("arquivo deveria ter sido apagado do disco: %v", err)
	}
	// DELETE duplicado -> 404
	if rec := reqJSON(srv.Handler(), "DELETE", "/api/v1/files/"+p, nil, cookies); rec.Code != http.StatusNotFound {
		t.Fatalf("DELETE repetido: esperado 404, obtido %d", rec.Code)
	}
}

// MID-R05: GET /api/v1/files?prefix= lista items e prefixes; prefixo vazio assume usuarios/{uid}.
func TestMid_ListItemsAndPrefixes_MID_R05(t *testing.T) {
	srv, _ := newTestServer(t, true)
	tfSignup(t, srv, "admin@vystudiocraft.local")
	uid, cookies, _ := tfSignup(t, srv, "m05@x.local")
	base := "/api/v1/files/usuarios/" + uid

	for _, p := range []string{"/a.txt", "/pasta/b.txt", "/pasta/sub/c.txt"} {
		if rec := tfRaw(t, srv, "PUT", base+p, "text/plain", []byte("x"), cookies, nil); rec.Code != http.StatusCreated {
			t.Fatalf("upload %s: %d", p, rec.Code)
		}
	}

	decodeList := func(rec *httptest.ResponseRecorder) ([]store.FileMeta, []string) {
		t.Helper()
		var out struct {
			Items    []store.FileMeta `json:"items"`
			Prefixes []string         `json:"prefixes"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
			t.Fatalf("decode list: %v", err)
		}
		return out.Items, out.Prefixes
	}

	// Prefixo explícito: items = arquivos diretos, prefixes = subpastas imediatas
	rec := reqJSON(srv.Handler(), "GET", "/api/v1/files?prefix=usuarios/"+uid, nil, cookies)
	if rec.Code != http.StatusOK {
		t.Fatalf("list: %d", rec.Code)
	}
	items, prefixes := decodeList(rec)
	if len(items) != 1 || items[0].Path != "usuarios/"+uid+"/a.txt" {
		t.Fatalf("items deveria conter apenas a.txt: %+v", items)
	}
	if len(prefixes) != 1 || prefixes[0] != "usuarios/"+uid+"/pasta" {
		t.Fatalf("prefixes deveria conter a subpasta: %+v", prefixes)
	}
	// Descendo no prefixo, lista o conteúdo da subpasta
	rec = reqJSON(srv.Handler(), "GET", "/api/v1/files?prefix=usuarios/"+uid+"/pasta", nil, cookies)
	items, prefixes = decodeList(rec)
	if len(items) != 1 || items[0].Path != "usuarios/"+uid+"/pasta/b.txt" {
		t.Fatalf("items da subpasta: %+v", items)
	}
	if len(prefixes) != 1 || prefixes[0] != "usuarios/"+uid+"/pasta/sub" {
		t.Fatalf("prefixes aninhados: %+v", prefixes)
	}
	// Prefixo vazio assume usuarios/{uid} do usuário autenticado
	rec = reqJSON(srv.Handler(), "GET", "/api/v1/files", nil, cookies)
	items, _ = decodeList(rec)
	if rec.Code != http.StatusOK || len(items) != 1 {
		t.Fatalf("prefixo vazio deveria listar o próprio uid: %d %+v", rec.Code, items)
	}
}

// MID-R08: paths de arquivos são normalizados; traversal ("..") nunca alcança o handler/disco.
func TestMid_PathTraversalRejected_MID_R08(t *testing.T) {
	srv, _ := newTestServer(t, true)
	_, admCookies, _ := tfSignup(t, srv, "admin@vystudiocraft.local")
	uid, cookies, _ := tfSignup(t, srv, "m06@x.local")
	uidOther, _, _ := tfSignup(t, srv, "m06o@x.local")

	// store.NormalizePath remove ".", ".." e segmentos vazios
	if got := store.NormalizePath("a/./b/../c//d"); got != "a/b/c/d" {
		t.Fatalf("NormalizePath: %q", got)
	}

	// ".." literal na URL: o mux redireciona para o path limpo (301), o handler nunca vê traversal
	rec := tfRaw(t, srv, "PUT", "/api/v1/files/usuarios/"+uid+"/dir/../../"+uidOther+"/evil.txt", "text/plain", []byte("x"), cookies, nil)
	if rec.Code < 300 || rec.Code >= 400 {
		t.Fatalf("traversal literal: esperado redirect 3xx, obtido %d", rec.Code)
	}

	// ".." URL-encoded chega ao PathValue; NormalizePath remove os segmentos ".." sem estourar a raiz:
	// "usuarios/{uid}/../../{other}/e.txt" normaliza para "usuarios/{uid}/{other}/e.txt" (permanece no próprio uid)
	rec = tfRaw(t, srv, "PUT", "/api/v1/files/usuarios/"+uid+"/%2e%2e/%2e%2e/"+uidOther+"/e.txt", "text/plain", []byte("x"), cookies, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("traversal encoded normalizado: esperado 201, obtido %d", rec.Code)
	}
	if m := tfFileMeta(t, rec); m.Path != "usuarios/"+uid+"/"+uidOther+"/e.txt" {
		t.Fatalf("path deveria estar normalizado sob o próprio uid: %q", m.Path)
	}
	// ".." intermediário também é removido: sub/../ok.txt -> sub/ok.txt
	rec = tfRaw(t, srv, "PUT", "/api/v1/files/usuarios/"+uid+"/sub/%2e%2e/ok.txt", "text/plain", []byte("x"), cookies, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("encoded no próprio uid: esperado 201, obtido %d", rec.Code)
	}
	if m := tfFileMeta(t, rec); m.Path != "usuarios/"+uid+"/sub/ok.txt" {
		t.Fatalf("path deveria estar normalizado: %q", m.Path)
	}
	// Nada foi criado na árvore do outro usuário
	for _, p := range []string{"usuarios/" + uidOther + "/evil.txt", "usuarios/" + uidOther + "/e.txt"} {
		if rec := reqJSON(srv.Handler(), "GET", "/api/v1/files/"+p, nil, admCookies); rec.Code != http.StatusNotFound {
			t.Fatalf("traversal não pode criar arquivo em uid alheio (%s): %d", p, rec.Code)
		}
	}
}
