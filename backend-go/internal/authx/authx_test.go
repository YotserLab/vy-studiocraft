package authx

import (
	"testing"
	"time"
)

func TestPasswordHashing(t *testing.T) {
	hash, err := HashPassword("SenhaForte#2026")
	if err != nil {
		t.Fatalf("HashPassword falhou: %v", err)
	}
	if !CheckPassword("SenhaForte#2026", hash) {
		t.Fatalf("CheckPassword deveria validar a senha correta")
	}
	if CheckPassword("SenhaErrada", hash) {
		t.Fatalf("CheckPassword não deveria validar senha incorreta")
	}
}

func TestTOTPFlow(t *testing.T) {
	secret, err := NewTOTPSecret()
	if err != nil {
		t.Fatalf("NewTOTPSecret falhou: %v", err)
	}
	now := time.Unix(1700000000, 0)
	code, err := TOTPCode(secret, now)
	if err != nil || len(code) != 6 {
		t.Fatalf("TOTPCode inválido: %v %q", err, code)
	}
	if !CheckTOTP(secret, code, now) {
		t.Fatalf("CheckTOTP falhou para janela exata")
	}
	if !CheckTOTP(secret, code, now.Add(30*time.Second)) {
		t.Fatalf("CheckTOTP falhou para tolerância de 30s")
	}
	if CheckTOTP(secret, "000000", now) && code != "000000" {
		t.Fatalf("CheckTOTP aceitou código inválido")
	}
}

func TestTokenEntropy(t *testing.T) {
	t1, err := Token(16)
	if err != nil || len(t1) != 32 {
		t.Fatalf("Token inválido: %v len=%d", err, len(t1))
	}
	t2, _ := Token(16)
	if t1 == t2 {
		t.Fatalf("Tokens consecutivos não devem colidir")
	}
}
