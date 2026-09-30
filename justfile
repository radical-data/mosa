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

# Start the public website on port 4322 (no database required).
dev *args:
    pnpm dev "$@"

preview *args:
    pnpm preview "$@"

# Build the public website.
build:
    pnpm build

# Validate the Git-backed public collection and all cross-file references.
collection-check:
    pnpm validate:collection

format:
    pnpm exec biome format --write .

check:
    pnpm exec biome check .

fix:
    pnpm exec biome check --write .

# Used by the pre-commit hook; filenames remain separate shell arguments.
check-staged +files:
    pnpm exec biome check --write --no-errors-on-unmatched "$@"

# Check local documentation links, anchors and just recipe references.
docs-check:
    node --import tsx scripts/check-docs.ts

typecheck:
    pnpm exec tsc --project tsconfig.scripts.json
    pnpm check

test *args:
    pnpm exec vitest run "$@"

# Run every check that does not require Docker.
verify: check docs-check typecheck test source-check build

# Build the production image from the repository root.
image:
    docker build --file Dockerfile --tag mosa-website:local .

# Verify the production image's HTTP behaviour after starting it on port 8080.
http-test *args:
    pnpm test:http "$@"

# Deploy the website and bundled collection from the current main commit.
deploy:
    node --import tsx scripts/deploy-website.ts

# Capture, register and inspect preserved evidence; run source doctor first.
source *args:
    node --import tsx scripts/source.ts "$@"

# Validate capture references without hydrating archive files.
source-check:
    node --import tsx scripts/source.ts check

# Keep shared, resumable museum research progress for source-linked objects.
research *args:
    node --import tsx scripts/research.ts "$@"

# Check every shared research register without private files or network access.
research-check:
    node --import tsx scripts/research.ts check
