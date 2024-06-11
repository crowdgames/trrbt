set -e

rm -rf out
mkdir -p out

cp index.html out/
cp p5js/p5.min.js out/
if [ "$1" = "rel" ]
then
    if command -v terser &> /dev/null
    then
        terser sketch.js -o out/sketch.min.js
    else
        echo 'ERROR: terser command not found'
        exit -1
    fi
else
    cp sketch.js out/sketch.js
fi

mkdir -p out/games
python3 yaml2json.py ../games/ttt.yaml out/games/ttt-text
python3 yaml2json.py ../games/connect4.yaml out/games/connect4-text
python3 yaml2json.py ../games/checkers.yaml out/games/checkers-text
python3 yaml2json.py ../games/checkers.yaml out/games/checkers --sprites ../games/sprites/checkers/checkers.yaml
python3 yaml2json.py ../games/soko.yaml out/games/soko-text
python3 yaml2json.py ../games/soko.yaml out/games/soko --sprites ../games/sprites/soko/soko.yaml
python3 yaml2json.py ../games/blockdude.yaml out/games/blockdude-text
python3 yaml2json.py ../games/blockdude.yaml out/games/blockdude --sprites ../games/sprites/blockdude/blockdude.yaml
python3 yaml2json.py ../games/limerick.yaml out/games/limerick-text
python3 yaml2json.py ../games/limerick.yaml out/games/limerick --sprites ../games/sprites/limerick/limerick.yaml
python3 yaml2json.py ../games/choice.yaml out/games/cyoa
python3 yaml2json.py ../games/lost_and_found.yaml out/games/text-adventure
python3 yaml2json.py ../games/rust.yaml out/games/rust-text
python3 yaml2json.py ../games/rust.yaml out/games/rust --sprites ../games/sprites/dungeon/rust.yaml
python3 yaml2json.py ../games/turn.yaml out/games/turn-text
python3 yaml2json.py ../games/turn.yaml out/games/turn --sprites ../games/sprites/turn/turn.yaml
python3 yaml2json.py ../games/loop.yaml out/games/loop-text
