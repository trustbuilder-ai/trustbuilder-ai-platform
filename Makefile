.PHONY: dev build preview clean install

dev:
	pnpm run dev

build:
	pnpm run build

preview:
	pnpm run preview

lint:
	pnpm run lint

typecheck:
	pnpm run typecheck

clean:
	rm -rf dist

install:
	pnpm install

serve: build
	pnpm serve -s dist -l 3000
