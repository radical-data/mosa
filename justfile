# mise owns tool versions; just owns repository commands.
# This also works when mise is not activated in the caller's shell.
set shell := ["mise", "exec", "--", "sh", "-eu", "-c"]
set positional-arguments

# Show available commands.
default:
    @just --list

# Install JavaScript dependencies and Git hooks using the committed lockfile.
install:
    pnpm install --frozen-lockfile
    pnpm exec lefthook install

# Start the public website on port 4322 (no database required).
alias dev := website-dev

website-dev *args:
    pnpm --filter @mosa/website dev "$@"

# Start the research explorer on port 4321.
explorer-dev *args:
    pnpm --filter @mosa/explorer dev "$@"

website-preview *args:
    pnpm --filter @mosa/website preview "$@"

explorer-preview *args:
    pnpm --filter @mosa/explorer preview "$@"

# Build both applications independently.
build: explorer-build website-build

website-build:
    pnpm --filter @mosa/website build

explorer-build:
    pnpm --filter @mosa/explorer build

website-check:
    pnpm --filter @mosa/website check

explorer-check:
    pnpm --filter @mosa/explorer check

format:
    pnpm exec biome format --write .

format-check:
    pnpm exec biome format .

lint:
    pnpm exec biome lint .

check:
    pnpm exec biome check .

check-fix:
    pnpm exec biome check --write .

# Used by the pre-commit hook; filenames remain separate shell arguments.
check-staged +files:
    pnpm exec biome check --write --no-errors-on-unmatched "$@"

typecheck-scripts:
    pnpm exec tsc --project tsconfig.scripts.json

typecheck: typecheck-scripts explorer-check website-check

test-unit:
    pnpm exec vitest run

# Resets the LOCAL database and loads synthetic fixtures before testing.
test-db:
    pnpm exec tsx scripts/verify-database.ts

alias db-verify := test-db

test: test-unit test-db

# All checks that do not require Docker or a database.
verify-static: check typecheck test-unit build

# Full verification; resets the LOCAL database.
verify: verify-static test-db db-types-check

# Pass through to the repository's pinned Supabase CLI.
supabase +args:
    pnpm exec supabase "$@"

db-start:
    pnpm exec supabase start

db-stop:
    pnpm exec supabase stop

db-status:
    pnpm exec supabase status

# Destructive to LOCAL data only; does not load fixtures automatically.
db-reset:
    pnpm exec supabase db reset --local --no-seed

db-migration name:
    pnpm exec supabase migration new "$1"

db-fixtures: db-fixtures-phase1 db-fixtures-phase2 db-fixtures-phase3

db-fixtures-phase1:
    pnpm exec tsx scripts/load-phase-1-fixtures.ts

db-fixtures-phase2:
    pnpm exec tsx scripts/load-phase-2-fixtures.ts

db-fixtures-phase3:
    pnpm exec tsx scripts/load-phase-3-fixtures.ts

db-lint:
    pnpm exec supabase db lint --local --level error

# Run all SQL tests against an already prepared local database.
db-test:
    pnpm exec supabase test db supabase/tests/database --local

db-types:
    pnpm exec tsx scripts/generate-database-types.ts

db-types-check:
    pnpm exec tsx scripts/generate-database-types.ts --check

db-import-dossier *args:
    pnpm exec tsx scripts/import-object-dossier.ts "$@"

db-import-dossier-check *args:
    pnpm exec tsx scripts/import-object-dossier.ts --check "$@"

db-import-bootstrap *args:
    pnpm exec tsx scripts/import-bootstrap-packets.ts "$@"

db-import-bootstrap-check *args:
    pnpm exec tsx scripts/import-bootstrap-packets.ts --check "$@"

db-import-verify:
    pnpm exec tsx scripts/verify-object-dossier-import.ts

# Build production images using the repository root as the build context.
docker-build: explorer-image website-image

explorer-image:
    docker build --file Dockerfile --tag mosa-explorer:local .

website-image:
    docker build --file apps/website/Dockerfile --tag mosa-website:local .

# Private maintainer workflow; see docs/collection-publication.md.
collection +args:
    pnpm exec tsx scripts/publish-collection.ts "$@"

collection-verify:
    pnpm exec tsx scripts/verify-collection-publication.ts

collection-website-verify:
    pnpm exec tsx scripts/verify-collection-website.ts

# Capture and pack local research; no provider keys or database access required.
research-bundle +args:
    pnpm exec tsx scripts/research-bundle.ts "$@"
