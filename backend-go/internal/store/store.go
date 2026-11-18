package store

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"vystudiocraft/internal/authx"
	"vystudiocraft/migrations"

	_ "modernc.org/sqlite"
)

var ErrNotFound = errors.New("documento não encontrado")

type User struct {
	ID            string  `json:"id"`
	Email         string  `json:"email"`
	PassHash      string  `json:"-"`
	DisplayName   string  `json:"displayName"`
	EmailVerified bool    `json:"emailVerified"`
	IsAdmin       bool    `json:"isAdmin"`
	MFASecret     *string `json:"-"`
	MFAEnabled    bool    `json:"mfaEnabled"`
	CreatedAt     int64   `json:"createdAt"`
	UpdatedAt     int64   `json:"updatedAt"`
}

type Session struct {
	Token     string
	UserID    string
	ExpiresAt int64
	ReauthAt  int64
}

type PendingLogin struct {
	Ticket    string
	UserID    string
	Purpose   string
	ExpiresAt int64
}

type Doc struct {
	Exists    bool           `json:"exists"`
	ID        string         `json:"id"`
	Path      string         `json:"path"`
	Coll      string         `json:"coll,omitempty"`
	Parent    string         `json:"parent,omitempty"`
	UID       string         `json:"uid,omitempty"`
	Data      map[string]any `json:"data"`
	CreatedAt int64          `json:"createdAt"`
	UpdatedAt int64          `json:"updatedAt"`
}

type FileMeta struct {
	Path        string `json:"fullPath"`
	UID         string `json:"uid,omitempty"`
	Name        string `json:"name"`
	ContentType string `json:"contentType"`
	Size        int64  `json:"size"`
	Disk        string `json:"-"`
	CreatedAt   int64  `json:"createdAt,omitempty"`
	UpdatedAt   int64  `json:"updated"`
	URL         string `json:"url"`
}

type AuditEvent struct {
	ID        int64  `json:"id"`
	UserID    string `json:"userId,omitempty"`
	Action    string `json:"action"`
	Detail    string `json:"detail"`
	CreatedAt int64  `json:"createdAt"`
}

type WhereClause struct {
	Field    string
	Op       string
	RawValue string
}

type ListOptions struct {
	Where        *WhereClause
	OrderByField string
	OrderDesc    bool
	Limit        int
}

type DB struct {
	sql   *sql.DB
	mu    sync.RWMutex
	subs  map[chan string]struct{}
	subMu sync.Mutex
}

func Open(databaseURL string) (*DB, error) {
	if databaseURL != ":memory:" && !strings.HasPrefix(databaseURL, "file:") && !strings.HasPrefix(databaseURL, "libsql://") {
		if err := os.MkdirAll(filepath.Dir(databaseURL), 0o755); err != nil {
			return nil, err
		}
	}
	conn, err := sql.Open("sqlite", databaseURL)
	if err != nil {
		return nil, err
	}
	if _, err := conn.Exec(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`); err != nil {
		_ = conn.Close()
		return nil, err
	}
	db := &DB{
		sql:  conn,
		subs: make(map[chan string]struct{}),
	}
	if err := db.Migrate(); err != nil {
		_ = conn.Close()
		return nil, err
	}
	return db, nil
}

func (d *DB) Close() error {
	return d.sql.Close()
}

func (d *DB) Migrate() error {
	entries, err := fs.ReadDir(migrations.FS, ".")
	if err != nil {
		return err
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Name() < entries[j].Name() })
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}
		raw, err := fs.ReadFile(migrations.FS, entry.Name())
		if err != nil {
			return err
		}
		if _, err := d.sql.Exec(string(raw)); err != nil {
			return fmt.Errorf("migration %s: %w", entry.Name(), err)
		}
	}
	return nil
}

// PLA-R21
func (d *DB) Subscribe() (<-chan string, func()) {
	ch := make(chan string, 32)
	d.subMu.Lock()
	d.subs[ch] = struct{}{}
	d.subMu.Unlock()
	return ch, func() {
		d.subMu.Lock()
		delete(d.subs, ch)
		close(ch)
		d.subMu.Unlock()
	}
}

func (d *DB) emit(docPath string) {
	d.subMu.Lock()
	defer d.subMu.Unlock()
	for ch := range d.subs {
		select {
		case ch <- docPath:
		default:
		}
	}
}

// PLA-R02: paths alternam coleção/doc
func NormalizePath(raw string) string {
	parts := strings.Split(raw, "/")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" || p == "." || p == ".." {
			continue
		}
		out = append(out, p)
	}
	return strings.Join(out, "/")
}

func splitPath(docPath string) (id, coll, parent, uid string) {
	parts := strings.Split(docPath, "/")
	if len(parts) > 0 {
		id = parts[len(parts)-1]
	}
	if len(parts) > 1 {
		coll = strings.Join(parts[:len(parts)-1], "/")
	}
	if len(parts) >= 3 {
		parent = strings.Join(parts[:len(parts)-2], "/")
	}
	if len(parts) >= 2 && (parts[0] == "usuarios" || parts[0] == "membros") {
		uid = parts[1]
	}
	return
}

func (d *DB) CountUsers() (int, error) {
	var cnt int
	err := d.sql.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&cnt)
	return cnt, err
}

func (d *DB) CreateUser(id, email, passHash, displayName string, emailVerified, isAdmin bool) (*User, error) {
	now := time.Now().UnixMilli()
	if id == "" {
		tok, err := authx.Token(10)
		if err != nil {
			return nil, err
		}
		id = tok
	}
	email = strings.ToLower(strings.TrimSpace(email))
	displayName = strings.TrimSpace(displayName)
	if displayName == "" {
		displayName = strings.Split(email, "@")[0]
	}
	ev := 0
	if emailVerified {
		ev = 1
	}
	adm := 0
	if isAdmin {
		adm = 1
	}
	_, err := d.sql.Exec(
		`INSERT INTO users (id, email, pass_hash, display_name, email_verified, is_admin, mfa_secret, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
		id, email, passHash, displayName, ev, adm, now, now,
	)
	if err != nil {
		return nil, err
	}
	return d.GetUserByID(id)
}

func scanUser(row interface{ Scan(...any) error }) (*User, error) {
	var u User
	var ev, adm int
	var mfa sql.NullString
	if err := row.Scan(&u.ID, &u.Email, &u.PassHash, &u.DisplayName, &ev, &adm, &mfa, &u.CreatedAt, &u.UpdatedAt); err != nil {
		return nil, err
	}
	u.EmailVerified = ev == 1
	u.IsAdmin = adm == 1
	if mfa.Valid && mfa.String != "" {
		s := mfa.String
		u.MFASecret = &s
		u.MFAEnabled = true
	}
	return &u, nil
}

func (d *DB) GetUserByID(id string) (*User, error) {
	row := d.sql.QueryRow(`SELECT id, email, pass_hash, display_name, email_verified, is_admin, mfa_secret, created_at, updated_at FROM users WHERE id = ?`, id)
	u, err := scanUser(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return u, err
}

func (d *DB) GetUserByEmail(email string) (*User, error) {
	row := d.sql.QueryRow(`SELECT id, email, pass_hash, display_name, email_verified, is_admin, mfa_secret, created_at, updated_at FROM users WHERE email = ?`, strings.ToLower(strings.TrimSpace(email)))
	u, err := scanUser(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return u, err
}

func (d *DB) UpdateUserVerified(id string, verified bool) error {
	ev := 0
	if verified {
		ev = 1
	}
	_, err := d.sql.Exec(`UPDATE users SET email_verified = ?, updated_at = ? WHERE id = ?`, ev, time.Now().UnixMilli(), id)
	return err
}

func (d *DB) UpdateUserMFA(id string, secret *string) error {
	var val any
	if secret != nil {
		val = *secret
	}
	_, err := d.sql.Exec(`UPDATE users SET mfa_secret = ?, updated_at = ? WHERE id = ?`, val, time.Now().UnixMilli(), id)
	return err
}

func (d *DB) UpdateUserPassword(id, passHash string) error {
	_, err := d.sql.Exec(`UPDATE users SET pass_hash = ?, updated_at = ? WHERE id = ?`, passHash, time.Now().UnixMilli(), id)
	return err
}

func (d *DB) UpdateUserDisplayName(id string, displayName string) error {
	_, err := d.sql.Exec(`UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?`,
		strings.TrimSpace(displayName), time.Now().UnixMilli(), id)
	return err
}

func (d *DB) CreateSession(token, userID string, ttl time.Duration) (*Session, error) {
	now := time.Now().UnixMilli()
	exp := now + ttl.Milliseconds()
	_, err := d.sql.Exec(`INSERT INTO sessions (token, user_id, expires_at, reauth_at) VALUES (?, ?, ?, ?)`, token, userID, exp, now)
	if err != nil {
		return nil, err
	}
	return &Session{Token: token, UserID: userID, ExpiresAt: exp, ReauthAt: now}, nil
}

func (d *DB) GetSession(token string) (*Session, error) {
	var s Session
	err := d.sql.QueryRow(`SELECT token, user_id, expires_at, reauth_at FROM sessions WHERE token = ?`, token).
		Scan(&s.Token, &s.UserID, &s.ExpiresAt, &s.ReauthAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if s.ExpiresAt <= time.Now().UnixMilli() {
		_ = d.DeleteSession(token)
		return nil, nil
	}
	return &s, nil
}

func (d *DB) TouchReauth(token string) error {
	_, err := d.sql.Exec(`UPDATE sessions SET reauth_at = ? WHERE token = ?`, time.Now().UnixMilli(), token)
	return err
}

func (d *DB) DeleteSession(token string) error {
	_, err := d.sql.Exec(`DELETE FROM sessions WHERE token = ?`, token)
	return err
}

func (d *DB) DeleteUserSessions(userID string) error {
	_, err := d.sql.Exec(`DELETE FROM sessions WHERE user_id = ?`, userID)
	return err
}

func (d *DB) CreatePendingLogin(ticket, userID, purpose string, ttl time.Duration) error {
	_, err := d.sql.Exec(
		`INSERT INTO pending_logins (ticket, user_id, purpose, expires_at) VALUES (?, ?, ?, ?)`,
		ticket, userID, purpose, time.Now().UnixMilli()+ttl.Milliseconds(),
	)
	return err
}

func (d *DB) GetPendingLogin(ticket string) (*PendingLogin, error) {
	var p PendingLogin
	err := d.sql.QueryRow(`SELECT ticket, user_id, purpose, expires_at FROM pending_logins WHERE ticket = ?`, ticket).
		Scan(&p.Ticket, &p.UserID, &p.Purpose, &p.ExpiresAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if p.ExpiresAt <= time.Now().UnixMilli() {
		_ = d.ConsumePendingLogin(ticket)
		return nil, nil
	}
	return &p, nil
}

func (d *DB) ConsumePendingLogin(ticket string) error {
	_, err := d.sql.Exec(`DELETE FROM pending_logins WHERE ticket = ?`, ticket)
	return err
}

func (d *DB) CreatePasswordReset(token, userID string, ttl time.Duration) error {
	_, err := d.sql.Exec(
		`INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)`,
		token, userID, time.Now().UnixMilli()+ttl.Milliseconds(),
	)
	return err
}

func (d *DB) ConsumePasswordReset(token string) (string, error) {
	var userID string
	var exp int64
	err := d.sql.QueryRow(`SELECT user_id, expires_at FROM password_resets WHERE token = ?`, token).Scan(&userID, &exp)
	_, _ = d.sql.Exec(`DELETE FROM password_resets WHERE token = ?`, token)
	if errors.Is(err, sql.ErrNoRows) || exp <= time.Now().UnixMilli() {
		return "", nil
	}
	return userID, err
}

func resolveSentinel(current any, incoming any, now int64, merge bool) (any, bool) {
	if m, ok := incoming.(map[string]any); ok {
		if len(m) == 1 {
			if _, ok := m["__del"]; ok {
				return nil, false
			}
			if _, ok := m["__svts"]; ok {
				return now, true
			}
			if rawInc, ok := m["__inc"]; ok {
				incNum, okNum := toFloat(rawInc)
				if okNum {
					base, _ := toFloat(current)
					return base + incNum, true
				}
			}
		}
		target := map[string]any{}
		if merge {
			if curMap, ok := current.(map[string]any); ok {
				for k, v := range curMap {
					target[k] = v
				}
			}
		}
		for k, v := range m {
			res, keep := resolveSentinel(target[k], v, now, merge)
			if !keep {
				delete(target, k)
			} else {
				target[k] = res
			}
		}
		return target, true
	}
	if arr, ok := incoming.([]any); ok {
		out := make([]any, 0, len(arr))
		for _, item := range arr {
			res, keep := resolveSentinel(nil, item, now, false)
			if keep {
				out = append(out, res)
			}
		}
		return out, true
	}
	return incoming, true
}

func toFloat(v any) (float64, bool) {
	switch t := v.(type) {
	case float64:
		return t, true
	case float32:
		return float64(t), true
	case int:
		return float64(t), true
	case int64:
		return float64(t), true
	default:
		return 0, false
	}
}

func applyDotPatch(current map[string]any, patch map[string]any, now int64) map[string]any {
	next := make(map[string]any, len(current))
	for k, v := range current {
		next[k] = v
	}
	for rawKey, val := range patch {
		segs := strings.Split(rawKey, ".")
		cursor := next
		for i := 0; i < len(segs)-1; i++ {
			seg := segs[i]
			sub, ok := cursor[seg].(map[string]any)
			if !ok {
				sub = map[string]any{}
				cursor[seg] = sub
			}
			cursor = sub
		}
		leaf := segs[len(segs)-1]
		res, keep := resolveSentinel(cursor[leaf], val, now, true)
		if !keep {
			delete(cursor, leaf)
		} else {
			cursor[leaf] = res
		}
	}
	return next
}

// PLA-R18
func (d *DB) GetDoc(rawPath string) (*Doc, error) {
	docPath := NormalizePath(rawPath)
	id, coll, parent, uid := splitPath(docPath)
	var dataStr string
	var createdAt, updatedAt int64
	err := d.sql.QueryRow(`SELECT data, created_at, updated_at FROM docs WHERE path = ?`, docPath).
		Scan(&dataStr, &createdAt, &updatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return &Doc{Exists: false, ID: id, Path: docPath, Coll: coll, Parent: parent, UID: uid, Data: map[string]any{}}, nil
	}
	if err != nil {
		return nil, err
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(dataStr), &parsed); err != nil {
		parsed = map[string]any{}
	}
	return &Doc{Exists: true, ID: id, Path: docPath, Coll: coll, Parent: parent, UID: uid, Data: parsed, CreatedAt: createdAt, UpdatedAt: updatedAt}, nil
}

// PLA-R16, PLA-R21
func (d *DB) SetDoc(rawPath string, data map[string]any, merge bool) (*Doc, error) {
	docPath := NormalizePath(rawPath)
	id, coll, parent, uid := splitPath(docPath)
	now := time.Now().UnixMilli()

	d.mu.Lock()
	tx, err := d.sql.Begin()
	if err != nil {
		d.mu.Unlock()
		return nil, err
	}
	var existingStr string
	var createdAt int64
	err = tx.QueryRow(`SELECT data, created_at FROM docs WHERE path = ?`, docPath).Scan(&existingStr, &createdAt)
	current := map[string]any{}
	if err == nil {
		_ = json.Unmarshal([]byte(existingStr), &current)
	} else {
		createdAt = now
	}
	base := map[string]any{}
	if merge {
		base = current
	}
	resolved, _ := resolveSentinel(base, data, now, merge)
	rawJSON, err := json.Marshal(resolved)
	if err != nil {
		_ = tx.Rollback()
		d.mu.Unlock()
		return nil, err
	}
	_, err = tx.Exec(
		`INSERT INTO docs (path, coll, parent, uid, data, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(path) DO UPDATE SET
		   coll = excluded.coll, parent = excluded.parent, uid = excluded.uid,
		   data = excluded.data, updated_at = excluded.updated_at`,
		docPath, coll, parent, uid, string(rawJSON), createdAt, now,
	)
	if err != nil {
		_ = tx.Rollback()
		d.mu.Unlock()
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		d.mu.Unlock()
		return nil, err
	}
	d.mu.Unlock()
	d.emit(docPath)
	var out map[string]any
	_ = json.Unmarshal(rawJSON, &out)
	return &Doc{Exists: true, ID: id, Path: docPath, Coll: coll, Parent: parent, UID: uid, Data: out, CreatedAt: createdAt, UpdatedAt: now}, nil
}

// PLA-R19, PLA-R21
func (d *DB) CreateDoc(rawColl string, data map[string]any) (*Doc, error) {
	coll := NormalizePath(rawColl)
	id, err := authx.Token(8)
	if err != nil {
		return nil, err
	}
	return d.SetDoc(coll+"/"+id, data, false)
}

// PLA-R17, PLA-R21
func (d *DB) PatchDoc(rawPath string, patch map[string]any) (*Doc, error) {
	docPath := NormalizePath(rawPath)
	now := time.Now().UnixMilli()

	d.mu.Lock()
	tx, err := d.sql.Begin()
	if err != nil {
		d.mu.Unlock()
		return nil, err
	}
	var existingStr string
	err = tx.QueryRow(`SELECT data FROM docs WHERE path = ?`, docPath).Scan(&existingStr)
	if errors.Is(err, sql.ErrNoRows) {
		_ = tx.Rollback()
		d.mu.Unlock()
		return nil, ErrNotFound
	}
	if err != nil {
		_ = tx.Rollback()
		d.mu.Unlock()
		return nil, err
	}
	current := map[string]any{}
	_ = json.Unmarshal([]byte(existingStr), &current)
	next := applyDotPatch(current, patch, now)
	rawJSON, err := json.Marshal(next)
	if err != nil {
		_ = tx.Rollback()
		d.mu.Unlock()
		return nil, err
	}
	if _, err := tx.Exec(`UPDATE docs SET data = ?, updated_at = ? WHERE path = ?`, string(rawJSON), now, docPath); err != nil {
		_ = tx.Rollback()
		d.mu.Unlock()
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		d.mu.Unlock()
		return nil, err
	}
	d.mu.Unlock()
	d.emit(docPath)
	return d.GetDoc(docPath)
}

func (d *DB) DeleteDoc(rawPath string) (bool, error) {
	docPath := NormalizePath(rawPath)
	res, err := d.sql.Exec(`DELETE FROM docs WHERE path = ?`, docPath)
	if err != nil {
		return false, err
	}
	affected, _ := res.RowsAffected()
	if affected > 0 {
		d.emit(docPath)
		return true, nil
	}
	return false, nil
}

// PLA-R11
func (d *DB) ListDocs(rawColl string, opts ListOptions) ([]Doc, error) {
	coll := NormalizePath(rawColl)
	rows, err := d.sql.Query(`SELECT path, coll, parent, uid, data, created_at, updated_at FROM docs WHERE coll = ?`, coll)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	docs := []Doc{}
	for rows.Next() {
		var p, c, parent string
		var uid sql.NullString
		var dataStr string
		var createdAt, updatedAt int64
		if err := rows.Scan(&p, &c, &parent, &uid, &dataStr, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		id, _, _, _ := splitPath(p)
		data := map[string]any{}
		_ = json.Unmarshal([]byte(dataStr), &data)
		doc := Doc{
			Exists:    true,
			ID:        id,
			Path:      p,
			Coll:      c,
			Parent:    parent,
			UID:       uid.String,
			Data:      data,
			CreatedAt: createdAt,
			UpdatedAt: updatedAt,
		}
		if opts.Where == nil || matchesWhere(doc, *opts.Where) {
			docs = append(docs, doc)
		}
	}
	if opts.OrderByField != "" {
		sort.Slice(docs, func(i, j int) bool {
			av := getDocField(docs[i], opts.OrderByField)
			bv := getDocField(docs[j], opts.OrderByField)
			af, aok := toFloat(av)
			bf, bok := toFloat(bv)
			var less bool
			if aok && bok {
				less = af < bf
			} else {
				less = fmt.Sprint(av) < fmt.Sprint(bv)
			}
			if opts.OrderDesc {
				return !less
			}
			return less
		})
	} else {
		sort.Slice(docs, func(i, j int) bool { return docs[i].UpdatedAt > docs[j].UpdatedAt })
	}
	if opts.Limit > 0 && len(docs) > opts.Limit {
		docs = docs[:opts.Limit]
	}
	return docs, nil
}

func getDocField(doc Doc, field string) any {
	switch field {
	case "id":
		return doc.ID
	case "createdAt":
		return float64(doc.CreatedAt)
	case "updatedAt":
		return float64(doc.UpdatedAt)
	}
	parts := strings.Split(field, ".")
	var cur any = doc.Data
	for _, p := range parts {
		m, ok := cur.(map[string]any)
		if !ok {
			return nil
		}
		cur = m[p]
	}
	return cur
}

func parseLiteral(raw string) any {
	if raw == "true" {
		return true
	}
	if raw == "false" {
		return false
	}
	if f, err := strconv.ParseFloat(raw, 64); err == nil {
		return f
	}
	return raw
}

func matchesWhere(doc Doc, w WhereClause) bool {
	actual := getDocField(doc, w.Field)
	target := parseLiteral(w.RawValue)
	switch w.Op {
	case "==":
		return fmt.Sprint(actual) == fmt.Sprint(target)
	case "!=":
		return fmt.Sprint(actual) != fmt.Sprint(target)
	case "<", "<=", ">", ">=":
		af, aok := toFloat(actual)
		tf, tok := toFloat(target)
		if aok && tok {
			switch w.Op {
			case "<":
				return af < tf
			case "<=":
				return af <= tf
			case ">":
				return af > tf
			case ">=":
				return af >= tf
			}
		}
		return false
	case "in":
		for _, item := range strings.Split(strings.Trim(w.RawValue, "[]"), ",") {
			if fmt.Sprint(actual) == strings.Trim(strings.TrimSpace(item), `"`) {
				return true
			}
		}
		return false
	case "array-contains":
		if arr, ok := actual.([]any); ok {
			for _, item := range arr {
				if fmt.Sprint(item) == fmt.Sprint(target) {
					return true
				}
			}
		}
		return false
	default:
		return false
	}
}

func (d *DB) UpsertFileMeta(meta FileMeta) (*FileMeta, error) {
	now := time.Now().UnixMilli()
	clean := NormalizePath(meta.Path)
	_, err := d.sql.Exec(
		`INSERT INTO files (path, uid, name, content_type, size, disk, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(path) DO UPDATE SET
		   name = excluded.name, content_type = excluded.content_type, size = excluded.size,
		   disk = excluded.disk, updated_at = excluded.updated_at`,
		clean, meta.UID, meta.Name, meta.ContentType, meta.Size, meta.Disk, now, now,
	)
	if err != nil {
		return nil, err
	}
	return d.GetFileMeta(clean)
}

func (d *DB) GetFileMeta(rawPath string) (*FileMeta, error) {
	clean := NormalizePath(rawPath)
	var m FileMeta
	err := d.sql.QueryRow(`SELECT path, uid, name, content_type, size, disk, created_at, updated_at FROM files WHERE path = ?`, clean).
		Scan(&m.Path, &m.UID, &m.Name, &m.ContentType, &m.Size, &m.Disk, &m.CreatedAt, &m.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	m.URL = "/api/v1/files/" + m.Path + "?download=1"
	return &m, nil
}

func (d *DB) ListFiles(rawPrefix string) ([]FileMeta, []string, error) {
	prefix := NormalizePath(rawPrefix)
	like := prefix + "/%"
	if prefix == "" {
		like = "%"
	}
	rows, err := d.sql.Query(`SELECT path, uid, name, content_type, size, disk, created_at, updated_at FROM files WHERE path LIKE ? ORDER BY path ASC`, like)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	items := []FileMeta{}
	folderSet := map[string]struct{}{}
	prefixLen := 0
	if prefix != "" {
		prefixLen = len(prefix) + 1
	}
	for rows.Next() {
		var m FileMeta
		if err := rows.Scan(&m.Path, &m.UID, &m.Name, &m.ContentType, &m.Size, &m.Disk, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, nil, err
		}
		m.URL = "/api/v1/files/" + m.Path + "?download=1"
		rest := m.Path[prefixLen:]
		if rest == "" {
			continue
		}
		if slash := strings.IndexByte(rest, '/'); slash == -1 {
			items = append(items, m)
		} else {
			sub := rest[:slash]
			if prefix != "" {
				sub = prefix + "/" + sub
			}
			folderSet[sub] = struct{}{}
		}
	}
	prefixes := make([]string, 0, len(folderSet))
	for k := range folderSet {
		prefixes = append(prefixes, k)
	}
	sort.Strings(prefixes)
	return items, prefixes, nil
}

func (d *DB) DeleteFileMeta(rawPath string) (*FileMeta, error) {
	existing, err := d.GetFileMeta(rawPath)
	if err != nil || existing == nil {
		return nil, err
	}
	if _, err := d.sql.Exec(`DELETE FROM files WHERE path = ?`, existing.Path); err != nil {
		return nil, err
	}
	return existing, nil
}

func (d *DB) LogAudit(userID, action, detail string) {
	_, _ = d.sql.Exec(
		`INSERT INTO audit_events (user_id, action, detail, created_at) VALUES (?, ?, ?, ?)`,
		userID, action, detail, time.Now().UnixMilli(),
	)
}

func (d *DB) ListAudit(limit int) ([]AuditEvent, error) {
	rows, err := d.sql.Query(`SELECT id, user_id, action, detail, created_at FROM audit_events ORDER BY id DESC LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []AuditEvent{}
	for rows.Next() {
		var ev AuditEvent
		var uid sql.NullString
		if err := rows.Scan(&ev.ID, &uid, &ev.Action, &ev.Detail, &ev.CreatedAt); err != nil {
			return nil, err
		}
		ev.UserID = uid.String
		out = append(out, ev)
	}
	return out, nil
}

// PLA-R03, PLA-R04, PLA-R06, PLA-R20
func CanReadDoc(u *User, rawPath string) bool {
	if u == nil {
		return false
	}
	if u.IsAdmin {
		return true
	}
	clean := NormalizePath(rawPath)
	parts := strings.Split(clean, "/")
	if len(parts) == 0 || parts[0] == "" {
		return false
	}
	switch parts[0] {
	case "usuarios":
		return len(parts) >= 2 && parts[1] == u.ID
	case "planos", "aulas":
		return true
	default:
		return false
	}
}

// PLA-R03, PLA-R04, PLA-R20
func CanWriteDoc(u *User, rawPath string, isCreate bool) bool {
	if u == nil {
		return false
	}
	if u.IsAdmin {
		return true
	}
	clean := NormalizePath(rawPath)
	parts := strings.Split(clean, "/")
	if len(parts) == 0 || parts[0] == "" {
		return false
	}
	switch parts[0] {
	case "usuarios":
		return len(parts) >= 2 && parts[1] == u.ID
	case "membros":
		return len(parts) == 2 && parts[1] == u.ID
	case "erros":
		return isCreate
	default:
		return false
	}
}

func CanAccessFile(u *User, rawPath string) bool {
	if u == nil {
		return false
	}
	clean := NormalizePath(rawPath)
	parts := strings.Split(clean, "/")
	if len(parts) < 2 || parts[0] != "usuarios" {
		return false
	}
	return u.IsAdmin || parts[1] == u.ID
}
