# VYStudioCraft — FE (Vite/React) + BE (Go)
# Dev:  Vite dev server :34567 com proxy /api -> Go :34568
# Prod: binário Go serve API + dist/ em :34567

PM ?= bun

.PHONY: dev dev-fe dev-be build build-fe build-be prod start clean lint

## Sobe FE + BE em modo dev (FE :34567, BE :34568)
dev:
	$(PM) run dev

## Somente frontend (Vite :34567)
dev-fe:
	$(PM) run dev:fe

## Somente backend (Go :34568)
dev-be:
	$(PM) run dev:be

## Compila FE (dist/) + BE (bin/vystudiocraft)
build: build-fe build-be

build-fe:
	$(PM) run build

build-be:
	$(PM) run build:be

## Build completo e sobe em modo produção (:34567)
prod: build
	PORT=34567 WEB_DIR=dist DATA_DIR=data ./bin/vystudiocraft

## Sobe produção sem rebuild (usa dist/ e bin/ existentes)
start:
	PORT=34567 WEB_DIR=dist DATA_DIR=data ./bin/vystudiocraft

lint:
	$(PM) run lint

clean:
	$(PM) run clean
