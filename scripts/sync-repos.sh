#!/usr/bin/env sh
set -eu

package_name="${1:-}"

if [ -z "$package_name" ]; then
  echo "usage: bun run sync-repos <package-name>" >&2
  exit 1
fi

package_dir="node_modules/$package_name"
repo_dir=".repos/$package_name"

if [ ! -f "$package_dir/package.json" ]; then
  echo "$package_name is not installed. run bun install first." >&2
  exit 1
fi

pkg_get() {
  bun --cwd="$package_dir" pm pkg get "$1" | bun --print 'await Bun.stdin.json()'
}

version="$(pkg_get version)"
repo_url="$(pkg_get repository.url)"
repo_url="${repo_url#git+}"

if [ -z "$version" ] || [ -z "$repo_url" ]; then
  echo "could not read package metadata for $package_name." >&2
  exit 1
fi

ref="${REPO_REF:-}"

if [ -z "$ref" ]; then
  for candidate in "$package_name@$version" "v$version" "$version"; do
    if git ls-remote --exit-code --tags "$repo_url" "refs/tags/$candidate" >/dev/null 2>&1; then
      ref="$candidate"
      break
    fi
  done
fi

if [ -z "$ref" ]; then
  echo "no source tag found for $package_name@$version." >&2
  echo "set REPO_REF to a branch, tag, or commit to override." >&2
  exit 1
fi

mkdir -p "$(dirname "$repo_dir")"

if [ ! -d "$repo_dir/.git" ]; then
  git clone --filter=blob:none --no-checkout "$repo_url" "$repo_dir"
fi

git -C "$repo_dir" remote set-url origin "$repo_url"

if git -C "$repo_dir" ls-remote --exit-code --tags origin "refs/tags/$ref" >/dev/null 2>&1; then
  git -C "$repo_dir" fetch --force --depth=1 origin "refs/tags/$ref:refs/tags/$ref"
  git -C "$repo_dir" switch --detach "refs/tags/$ref"
else
  git -C "$repo_dir" fetch --force --depth=1 origin "$ref"
  git -C "$repo_dir" switch --detach FETCH_HEAD
fi

echo "reference repo ready at $repo_dir"
echo "package: $package_name@$version"
echo "source ref: $ref"
