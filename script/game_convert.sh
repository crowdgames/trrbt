set -e

ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)/..

bash "${ROOT}/script/node_check.sh"
node -e "$(cat "${ROOT}/docs/common.js" "${ROOT}/script/gv.js" "${ROOT}/script/util.js" "${ROOT}/script/game_convert.js")" -- "$@"
