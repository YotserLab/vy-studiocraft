package config

import (
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type Config struct {
	Addr        string
	DatabaseURL string
	DataDir     string
	WebDir      string
	MediaDir    string
	RenderURL   string
	AdminEmail  string
	AppOrigin   string
	SessionDays int
	UploadMaxMB int64
	DevMode     bool
	SignupOpen  bool
	UseMockData bool
}

func envBool(key string, fallback bool) bool {
	val, ok := os.LookupEnv(key)
	if !ok || strings.TrimSpace(val) == "" {
		return fallback
	}
	v := strings.ToLower(strings.TrimSpace(val))
	return v == "1" || v == "true" || v == "yes" || v == "on"
}

func envInt(key string, fallback int) int {
	val := strings.TrimSpace(os.Getenv(key))
	if val == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(val)
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}

func Load() Config {
	addr := strings.TrimSpace(os.Getenv("ADDR"))
	if addr == "" {
		if port := strings.TrimSpace(os.Getenv("PORT")); port != "" {
			if strings.HasPrefix(port, ":") {
				addr = port
			} else {
				addr = ":" + port
			}
		} else {
			addr = ":8080"
		}
	}

	dataDir := strings.TrimSpace(os.Getenv("DATA_DIR"))
	if dataDir == "" {
		if _, err := os.Stat("../data"); err == nil {
			dataDir = "../data"
		} else {
			dataDir = "data"
		}
	}

	webDir := strings.TrimSpace(os.Getenv("WEB_DIR"))
	if webDir == "" {
		if _, err := os.Stat("../dist"); err == nil {
			webDir = "../dist"
		} else if _, err := os.Stat("../web"); err == nil {
			webDir = "../web"
		} else {
			webDir = "web"
		}
	}

	mediaDir := strings.TrimSpace(os.Getenv("MEDIA_DIR"))
	if mediaDir == "" {
		if _, err := os.Stat("../media"); err == nil {
			mediaDir = "../media"
		} else {
			mediaDir = "media"
		}
	}

	renderURL := strings.TrimRight(strings.TrimSpace(os.Getenv("RENDER_SERVICE_URL")), "/")
	if renderURL == "" {
		renderURL = "http://localhost:8090"
	}

	dbURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dbURL == "" {
		dbURL = filepath.Join(dataDir, "vystudiocraft.db")
	}

	adminEmail := strings.ToLower(strings.TrimSpace(os.Getenv("ADMIN_EMAIL")))
	if adminEmail == "" {
		adminEmail = "admin@vystudiocraft.local"
	}

	appOrigin := strings.TrimRight(strings.TrimSpace(os.Getenv("APP_ORIGIN")), "/")
	if appOrigin == "" {
		appOrigin = "http://localhost:8080"
	}

	devMode := envBool("DEV_MODE", true)
	signupOpen := envBool("SIGNUP_OPEN", false)
	useMock := devMode
	if _, ok := os.LookupEnv("USE_MOCK_DATA"); ok {
		useMock = envBool("USE_MOCK_DATA", devMode)
	} else if _, ok := os.LookupEnv("SEED_DEMO"); ok {
		useMock = envBool("SEED_DEMO", devMode)
	}

	return Config{
		Addr:        addr,
		DatabaseURL: dbURL,
		DataDir:     dataDir,
		WebDir:      webDir,
		MediaDir:    mediaDir,
		RenderURL:   renderURL,
		AdminEmail:  adminEmail,
		AppOrigin:   appOrigin,
		SessionDays: envInt("SESSION_DAYS", 30),
		UploadMaxMB: int64(envInt("UPLOAD_MAX_MB", 512)),
		DevMode:     devMode,
		SignupOpen:  signupOpen,
		UseMockData: useMock,
	}
}
