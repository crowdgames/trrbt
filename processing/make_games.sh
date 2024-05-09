rm -rf out
mkdir -p out

cp index.html out/
cp p5js/p5.min.js out/
if command -v terser &> /dev/null
then
    terser sketch.js -o out/sketch.min.js
else
    cp sketch.js out/sketch.js
fi

mkdir -p out/games
python yaml2json.py ../games/ttt.yaml out/games/ttt-text
python yaml2json.py ../games/connect4.yaml out/games/connect4-text
python yaml2json.py ../games/checkers.yaml out/games/checkers-text
python yaml2json.py ../games/checkers.yaml out/games/checkers --sprites ../games/sprites/checkers/checkers.yaml
python yaml2json.py ../games/soko.yaml out/games/soko-text
python yaml2json.py ../games/soko.yaml out/games/soko --sprites ../games/sprites/soko/soko.yaml
python yaml2json.py ../games/blockdude.yaml out/games/blockdude-text
python yaml2json.py ../games/blockdude.yaml out/games/blockdude --sprites ../games/sprites/blockdude/blockdude.yaml
python yaml2json.py ../games/rust.yaml out/games/rust-text
python yaml2json.py ../games/rust.yaml out/games/rust --sprites ../games/sprites/dungeon/rust.yaml
python yaml2json.py ../games/turn.yaml out/games/turn-text
python yaml2json.py ../games/turn.yaml out/games/turn --sprites ../games/sprites/turn/turn.yaml
