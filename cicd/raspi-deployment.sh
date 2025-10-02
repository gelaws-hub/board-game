#!/bin/bash
set -e

# Arguments
DEB_FILE="$1"
RASPI_USER="pi"
RASPI_HOST="$2"
RASPI_REPO_DIR="/var/www/html/myraspberrypi"
RASPI_ARCH_DIR="$RASPI_REPO_DIR/dists/bookworm/main/binary-arm64"

if [[ -z "$DEB_FILE" ]]; then
  echo "Usage: $0 <path-to-deb-file>"
  exit 1
fi

echo ">>> Copying package to Raspberry Pi..."
scp "$DEB_FILE" ${RASPI_USER}@${RASPI_HOST}:/tmp/

echo ">>> Moving package into repo & updating metadata..."
ssh ${RASPI_USER}@${RASPI_HOST} <<EOF
  set -e
  sudo mv /tmp/$(basename "$DEB_FILE") "$RASPI_ARCH_DIR"

  cd "$RASPI_REPO_DIR"

  # Rebuild metadata (with multiversion support)
  dpkg-scanpackages --multiversion dists/bookworm/main/binary-arm64 > dists/bookworm/main/binary-arm64/Packages
  gzip -k -f dists/bookworm/main/binary-arm64/Packages
  apt-ftparchive release dists/bookworm > dists/bookworm/Release

  echo ">>> Repository updated successfully!"
EOF
