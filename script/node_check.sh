set -e

ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)/..

node -e "$(cat "${ROOT}/script/node_check.js")"
