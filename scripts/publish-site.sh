#!/usr/bin/env bash
# サンプルサイトを組み立てて、gh-pages ブランチのルートへ push する。
#   scripts/publish-site.sh            … 組み立てて公開する
#   scripts/publish-site.sh --dry-run  … 組み立てて、push せずに差分の有無だけ見る
# GitHub Actions は使わない（この環境のトークンに workflow スコープがないため）。
# 公開されるのは、いまの作業ツリーの docs/・tokens/・site/ から組み立てた内容。
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

remote="${REMOTE:-origin}"
branch="gh-pages"
dry_run=0
[ "${1:-}" = "--dry-run" ] && dry_run=1

# 公開する中身がコミット済みかを確かめる（どのコミットのサイトか分かるようにするため）
if [ -n "$(git status --porcelain -- docs tokens site scripts README.md CHANGELOG.md package.json)" ] && [ "${ALLOW_DIRTY:-0}" != "1" ]; then
  echo "docs/・tokens/・site/・scripts/ などに未コミットの変更があります。コミットしてから実行してください（そのまま出すときは ALLOW_DIRTY=1）。" >&2
  exit 1
fi

tmp="$(mktemp -d)"
trap 'rm -rf -- "$tmp"' EXIT
out="$tmp/site"

node scripts/build-site.mjs "$out"

# gh-pages の今の先頭（なければ新しく作る）
git fetch --quiet "$remote" "$branch" 2>/dev/null || true
parent="$(git rev-parse -q --verify "refs/remotes/$remote/$branch" || true)"

# 作業ツリーやブランチを切り替えずに、組み立てた中身からコミットを作る
export GIT_INDEX_FILE="$tmp/index"
git --work-tree="$out" add -A .
tree="$(git write-tree)"
unset GIT_INDEX_FILE

if [ -n "$parent" ] && [ "$(git rev-parse "$parent^{tree}")" = "$tree" ]; then
  echo "変更なし: $branch はすでに同じ内容です。"
  exit 0
fi

src="$(git rev-parse --short HEAD)"
version="$(node -p "require('./package.json').version")"
msg="サンプルサイトを更新（Muse DS v$version、main $src から組み立て）"
if [ -n "$parent" ]; then
  commit="$(git commit-tree "$tree" -p "$parent" -m "$msg")"
else
  commit="$(git commit-tree "$tree" -m "$msg")"
fi

if [ "$dry_run" = "1" ]; then
  echo "dry-run: $branch に $commit を作れる状態です（push はしていません）。"
  exit 0
fi

git push "$remote" "$commit:refs/heads/$branch"
git fetch --quiet "$remote" "$branch"

# GitHub Pages が未設定なら、gh-pages ブランチのルートで有効にする
repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
if ! gh api "repos/$repo/pages" >/dev/null 2>&1; then
  gh api -X POST "repos/$repo/pages" -f "source[branch]=$branch" -f "source[path]=/" >/dev/null
  echo "GitHub Pages を有効にしました（$branch ブランチのルート）。"
fi

url="$(gh api "repos/$repo/pages" -q .html_url)"
echo "公開しました: $url （反映まで1〜2分かかることがあります）"
