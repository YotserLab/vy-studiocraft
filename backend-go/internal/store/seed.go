package store

import (
	"os"
	"path/filepath"
	"time"

	"vystudiocraft/internal/authx"
	"vystudiocraft/internal/config"
)

func SeedIfEnabled(db *DB, cfg config.Config) error {
	if !cfg.UseMockData {
		return nil
	}
	cnt, err := db.CountUsers()
	if err != nil || cnt > 0 {
		return err
	}

	adminHash, err := authx.HashPassword("Admin@1234")
	if err != nil {
		return err
	}
	admin, err := db.CreateUser("usr_admin_01", cfg.AdminEmail, adminHash, "Rafael Mendes (Admin)", true, true)
	if err != nil {
		return err
	}

	creatorHash, err := authx.HashPassword("Creator@1234")
	if err != nil {
		return err
	}
	creator, err := db.CreateUser("usr_creator_02", "creator@vystudiocraft.local", creatorHash, "Camila Duarte", true, false)
	if err != nil {
		return err
	}

	now := time.Now().UnixMilli()
	_, _ = db.SetDoc("membros/"+admin.ID, map[string]any{
		"uid": admin.ID, "nome": admin.DisplayName, "email": admin.Email,
		"papel": "admin", "plano": "estudio", "status": "ativo", "ultimoAcesso": now,
	}, false)
	_, _ = db.SetDoc("membros/"+creator.ID, map[string]any{
		"uid": creator.ID, "nome": creator.DisplayName, "email": creator.Email,
		"papel": "convidado", "plano": "solo", "status": "ativo", "ultimoAcesso": now,
	}, false)

	_, _ = db.SetDoc("planos/catalogo", map[string]any{
		"descricao": "Limites operacionais de workspace (sem cobrança)",
		"niveis": []any{
			map[string]any{"id": "solo", "nome": "Criador Solo", "limiteCanais": 2, "limiteProjetosAtivos": 15, "limiteRoteirosIaMes": 40, "limiteStorageMb": 2048},
			map[string]any{"id": "estudio", "nome": "Estúdio Operacional", "limiteCanais": 10, "limiteProjetosAtivos": 100, "limiteRoteirosIaMes": 250, "limiteStorageMb": 20480},
			map[string]any{"id": "rede", "nome": "Rede Multi-Canais", "limiteCanais": 50, "limiteProjetosAtivos": 500, "limiteRoteirosIaMes": 1000, "limiteStorageMb": 102400},
		},
	}, false)

	_, _ = db.SetDoc("aulas/aula_01", map[string]any{
		"titulo": "Arquitetura dos Primeiros 30 Segundos", "modulo": "Retenção", "duracaoMin": 18,
		"nivel": "Essencial", "instrutor": "Rafael Mendes", "ordem": 1,
		"resumo":  "Como alinhar expectativa da thumbnail com a promessa falada nos primeiros 30 segundos.",
		"topicos": []any{"Quebra de padrão visual", "Promessa explícita"},
	}, false)

	_, _ = db.SetDoc("usuarios/"+admin.ID+"/canais/ch_tech_br", map[string]any{
		"nome": "Tech & Automação BR", "handle": "@techautomacaobr", "nicho": "Tecnologia & Produtividade",
		"tipo": "proprio", "inscritos": 148500, "views30d": 892400, "ctrMedio": 7.4, "retencaoMedia": 54.2,
	}, false)

	_, _ = db.SetDoc("usuarios/"+admin.ID+"/radar_perfis/rad_01", map[string]any{
		"nome": "Agentes Autônomos Locais", "nicho": "IA & Automação", "formato": "Long (10-16 min)",
		"aceleracao": "alta", "taxaOutliers": 3.8, "viewsMedias7d": 94000, "concorrencia": "Média",
		"sinais": []any{"3 canais abaixo de 50k inscritos passaram de 180k views em 72h."},
	}, false)

	_, _ = db.SetDoc("usuarios/"+admin.ID+"/projetos/proj_01", map[string]any{
		"titulo": "Como Estruturar Agentes de Roteiro Sem Perder Autenticidade",
		"canalNome": "Tech & Automação BR", "estagio": "roteiro", "formato": "long",
		"prioridade": "alta", "ctrAlvo": 8.5, "versaoAtual": 2,
	}, false)

	_, _ = db.SetDoc("usuarios/"+admin.ID+"/projetos/proj_01/versoes/v1", map[string]any{
		"versao": 1, "autor": admin.DisplayName, "resumoMudanca": "Rascunho inicial",
	}, false)

	_, _ = db.SetDoc("usuarios/"+admin.ID+"/ideias/idea_01", map[string]any{
		"titulo": "Benchmark: 5 Hooks de Canais Gringos", "nicho": "Tecnologia", "potencial": "alto", "origem": "Radar",
	}, false)

	_, _ = db.SetDoc("usuarios/"+admin.ID+"/notas/nota_01", map[string]any{
		"titulo": "Padrão de Luz e Áudio", "categoria": "Produção", "conteudo": "Key light em 45 graus a 4200K.",
	}, false)

	// Creator workspace seed
	_, _ = db.SetDoc("usuarios/"+creator.ID+"/canais/ch_creator_01", map[string]any{
		"nome": "Estúdio Visual & Cortes", "handle": "@estudiovisualcortes", "nicho": "Edição & Storytelling",
		"tipo": "proprio", "inscritos": 42900, "views30d": 268400, "ctrMedio": 8.6, "retencaoMedia": 59.1,
	}, false)
	_, _ = db.SetDoc("usuarios/"+creator.ID+"/radar_perfis/rad_cr_01", map[string]any{
		"nome": "Breakdown de Edição Quadro a Quadro", "nicho": "Edição & Storytelling",
		"aceleracao": "alta", "taxaOutliers": 3.5, "viewsMedias7d": 76000,
	}, false)
	_, _ = db.SetDoc("usuarios/"+creator.ID+"/projetos/proj_cr_01", map[string]any{
		"titulo": "Por Que Seu Vídeo Cai Nos Primeiros 25 Segundos",
		"canalNome": "Estúdio Visual & Cortes", "estagio": "roteiro", "formato": "long",
		"prioridade": "alta", "ctrAlvo": 8.8, "versaoAtual": 1,
	}, false)
	_, _ = db.SetDoc("usuarios/"+creator.ID+"/projetos/proj_cr_01/versoes/v1", map[string]any{
		"versao": 1, "autor": creator.DisplayName, "resumoMudanca": "Estrutura inicial",
	}, false)

	// Demo file on disk
	demoRel := "usuarios/" + admin.ID + "/roteiros-base/guia-ganchos-30s.txt"
	demoDisk := filepath.Join(cfg.DataDir, "files", filepath.FromSlash(demoRel))
	if err := os.MkdirAll(filepath.Dir(demoDisk), 0o755); err == nil {
		content := []byte("GUIA RAPIDO - PRIMEIROS 30 SEGUNDOS\n")
		if err := os.WriteFile(demoDisk, content, 0o644); err == nil {
			_, _ = db.UpsertFileMeta(FileMeta{
				Path:        demoRel,
				UID:         admin.ID,
				Name:        "guia-ganchos-30s.txt",
				ContentType: "text/plain; charset=utf-8",
				Size:        int64(len(content)),
				Disk:        demoDisk,
			})
		}
	}

	db.LogAudit(admin.ID, "seed_dev", "Seed de desenvolvimento carregado.")
	return nil
}
