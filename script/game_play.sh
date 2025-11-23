set -e

ROOT=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/..

node -e "$(cat ${ROOT}/docs/common.js ${ROOT}/docs/engine.js ${ROOT}/script/util.js ${ROOT}/script/game_play.js)" -- "$@"
