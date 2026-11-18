package store

import (
	"path/filepath"
	"testing"
	"time"

	"vystudiocraft/internal/authx"
)

func TestStoreMigrationsAndDocs(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "test.db")
	db, err := Open(dbPath)
	if err != nil {
		t.Fatalf("Open falhou: %v", err)
	}
	defer db.Close()

	// Idempotent migrations
	if err := db.Migrate(); err != nil {
		t.Fatalf("Migrate idempotente falhou: %v", err)
	}

	hash, _ := authx.HashPassword("123456")
	u, err := db.CreateUser("", "dev@vystudiocraft.local", hash, "Dev", true, true)
	if err != nil {
		t.Fatalf("CreateUser falhou: %v", err)
	}

	sess, err := db.CreateSession("tok_1", u.ID, time.Hour)
	if err != nil || sess.Token != "tok_1" {
		t.Fatalf("CreateSession falhou: %v", err)
	}
	gotSess, err := db.GetSession("tok_1")
	if err != nil || gotSess == nil || gotSess.UserID != u.ID {
		t.Fatalf("GetSession falhou: %v", err)
	}

	// Upsert + sentinels
	_, err = db.SetDoc("usuarios/"+u.ID+"/projetos/p1", map[string]any{
		"titulo":      "Teste",
		"versaoAtual": 1,
		"temp":        "remover",
		"ts":          map[string]any{"__svts": 1},
	}, false)
	if err != nil {
		t.Fatalf("SetDoc falhou: %v", err)
	}

	merged, err := db.SetDoc("usuarios/"+u.ID+"/projetos/p1", map[string]any{
		"versaoAtual": map[string]any{"__inc": 2},
		"temp":        map[string]any{"__del": 1},
	}, true)
	if err != nil {
		t.Fatalf("SetDoc merge falhou: %v", err)
	}
	if merged.Data["versaoAtual"] != float64(3) {
		t.Fatalf("esperado versaoAtual=3, obtido %v", merged.Data["versaoAtual"])
	}
	if _, exists := merged.Data["temp"]; exists {
		t.Fatalf("campo temp deveria ter sido removido por __del")
	}
}
