package authx

import (
	"encoding/hex"
	"strconv"
	"strings"
	"testing"
)

// CON-R15: senha persistida como PBKDF2-SHA256, 100k iterações,
// formato pbkdf2_sha256$iter$salt$hash.
func TestAuthRules_CONR15_PBKDF2Format(t *testing.T) {
	hash, err := HashPassword("Senha#Forte123")
	if err != nil {
		t.Fatalf("HashPassword falhou: %v", err)
	}
	parts := strings.Split(hash, "$")
	if len(parts) != 4 {
		t.Fatalf("formato esperado pbkdf2_sha256$iter$salt$hash, obtido %q", hash)
	}
	if parts[0] != "pbkdf2_sha256" {
		t.Fatalf("algoritmo esperado pbkdf2_sha256, obtido %q", parts[0])
	}
	iters, err := strconv.Atoi(parts[1])
	if err != nil || iters != 100000 {
		t.Fatalf("iterações esperadas 100000, obtido %q", parts[1])
	}
	salt, err := hex.DecodeString(parts[2])
	if err != nil || len(salt) != 16 {
		t.Fatalf("salt deveria ser hex de 16 bytes, obtido %q", parts[2])
	}
	dk, err := hex.DecodeString(parts[3])
	if err != nil || len(dk) != 32 {
		t.Fatalf("hash deveria ser hex de 32 bytes, obtido %q", parts[3])
	}
	if !CheckPassword("Senha#Forte123", hash) {
		t.Fatalf("CheckPassword deveria validar a senha correta")
	}
	if CheckPassword("OutraSenha", hash) {
		t.Fatalf("CheckPassword não deveria validar senha incorreta")
	}
}

// CON-R15: salts aleatórios — hashes da mesma senha diferem.
func TestAuthRules_CONR15_RandomSalt(t *testing.T) {
	h1, err := HashPassword("mesma-senha")
	if err != nil {
		t.Fatalf("HashPassword falhou: %v", err)
	}
	h2, err := HashPassword("mesma-senha")
	if err != nil {
		t.Fatalf("HashPassword falhou: %v", err)
	}
	if h1 == h2 {
		t.Fatalf("hashes iguais para a mesma senha indicam salt fixo")
	}
	// ambos continuam verificáveis
	if !CheckPassword("mesma-senha", h1) || !CheckPassword("mesma-senha", h2) {
		t.Fatalf("CheckPassword deveria validar ambos os hashes")
	}
}

// CON-R15: CheckPassword rejeita formatos/strings malformados.
func TestAuthRules_CONR15_MalformedHash(t *testing.T) {
	for _, stored := range []string{
		"",
		"plaintext",
		"bcrypt$10$abc$def",
		"pbkdf2_sha256",
		"pbkdf2_sha256$abc$deadbeef$deadbeef",          // iterações não numéricas
		"pbkdf2_sha256$0$deadbeef$deadbeef",            // iterações <= 0
		"pbkdf2_sha256$100000$$deadbeef",               // salt vazio
		"pbkdf2_sha256$100000$deadbeef$zzzz",           // hash não-hex
		"pbkdf2_sha256$100000$deadbeef$",               // hash vazio
		"pbkdf2_sha256$100000$deadbeef$deadbeef$extra", // campo extra
	} {
		if CheckPassword("qualquer", stored) {
			t.Fatalf("CheckPassword aceitou hash malformado %q", stored)
		}
	}
}
