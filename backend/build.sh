#!/usr/bin/env bash
#
# Builds the Lambda layer that Terraform packages and uploads.
#
# The layer holds the third-party dependencies; the handler source is zipped
# directly from src/ by Terraform, so editing a handler needs no rebuild here.
#
# Usage:  ./build.sh
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAYER_DIR="${BACKEND_DIR}/build/layer/python"

# Lambda's Python runtime. Keep in sync with `lambda_runtime` in infra/variables.tf.
PYTHON_VERSION="3.12"

echo "==> Cleaning previous build"
rm -rf "${BACKEND_DIR}/build"
mkdir -p "${LAYER_DIR}"

echo "==> Installing dependencies for manylinux2014_x86_64 / py${PYTHON_VERSION}"
# --platform with --only-binary pulls Linux wheels even when building on macOS,
# which matters because google-auth's dependencies include compiled packages.
pip install \
  --requirement "${BACKEND_DIR}/requirements.txt" \
  --target "${LAYER_DIR}" \
  --platform manylinux2014_x86_64 \
  --python-version "${PYTHON_VERSION}" \
  --implementation cp \
  --only-binary=:all: \
  --upgrade \
  --quiet

echo "==> Removing files that do not belong in a layer"
find "${LAYER_DIR}" -type d -name "__pycache__" -prune -exec rm -rf {} +
find "${LAYER_DIR}" -type d -name "*.dist-info" -prune -exec rm -rf {} +
find "${LAYER_DIR}" -type d -name "tests" -prune -exec rm -rf {} +

echo "==> Layer built at ${LAYER_DIR}"
du -sh "${BACKEND_DIR}/build/layer"
echo "==> Now run: cd ../infra && terraform apply"
