set -ex

for game in `find games/trees -type f | sort | cut -c 13-`; do
    bash script/game_convert.sh --folder games/trees --game ${game} --fmt json --rename --out games/trees/${game}
done
