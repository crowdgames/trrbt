set -ex

for game in `cd games/trees ; find . -name "*.json" | cut -c 3-`; do
    echo ${game}
    bash script/game_cvt.sh --folder games/trees --game ${game} --fmt json --rename --out games/trees/${game}
done
