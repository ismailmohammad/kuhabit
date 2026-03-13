#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if command -v rg >/dev/null 2>&1; then
  SEARCH_BIN="rg"
  SEARCH_ARGS=(-n --glob '*.go')
else
  SEARCH_BIN="grep"
  SEARCH_ARGS=(-RIn --include='*.go')
fi

TARGET_DIR="backend"

echo "Running SQL injection guard scan in $TARGET_DIR ..."

declare -a findings=()

run_check() {
  local description="$1"
  local pattern="$2"
  local result
  if [[ "$SEARCH_BIN" == "rg" ]]; then
    result="$($SEARCH_BIN "${SEARCH_ARGS[@]}" "$pattern" "$TARGET_DIR" || true)"
  else
    result="$($SEARCH_BIN "${SEARCH_ARGS[@]}" -E "$pattern" "$TARGET_DIR" || true)"
  fi
  if [[ -n "$result" ]]; then
    findings+=("$description"$'\n'"$result")
  fi
}

# 1) Dynamic SQL via fmt.Sprintf passed directly into query APIs.
run_check \
  "Potential dynamic SQL: fmt.Sprintf used directly in query builder." \
  '\.(Exec|Raw|Where|Joins|Order)\(\s*fmt\.Sprintf'

# 2) SQL-ish literal concatenation patterns.
run_check \
  "Potential SQL string concatenation in query builder call." \
  '\.(Exec|Raw|Where|Joins|Order)\(\s*"[^"]*(SELECT|UPDATE|DELETE|INSERT|WITH|ALTER|CREATE|DROP|WHERE|ORDER BY)[^"]*"\s*\+'
run_check \
  "Potential SQL string concatenation (prefix concat) in query builder call." \
  '\.(Exec|Raw|Where|Joins|Order)\(\s*[^,)]*\+\s*"[^"]*(SELECT|UPDATE|DELETE|INSERT|WITH|ALTER|CREATE|DROP|WHERE|ORDER BY)'

# 3) Non-literal ORDER BY arguments (high-risk if fed from request params).
run_check \
  "Potential dynamic ORDER BY argument (review for user input)." \
  '\.Order\(\s*[a-zA-Z_][a-zA-Z0-9_\.]*\s*\)'

if (( ${#findings[@]} > 0 )); then
  echo
  echo "SQL injection guard found potential issues:"
  echo "-------------------------------------------"
  for f in "${findings[@]}"; do
    echo "$f"
    echo "-------------------------------------------"
  done
  echo "Review findings. Use parameterized queries/placeholders and constant ORDER BY clauses."
  exit 1
fi

echo "SQL injection guard passed."
