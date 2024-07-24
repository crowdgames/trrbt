set -e

rm -rf games
mkdir -p games/xform
mkdir -p games/unxform

python make_game.py ../games/ttt.yaml games/xform ttt-text --xform
python make_game.py ../games/connect4.yaml games/xform connect4-text --xform
python make_game.py ../games/checkers.yaml games/xform checkers-text --xform
python make_game.py ../games/checkers.yaml games/xform checkers --xform --sprites ../games/sprites/checkers/checkers.yaml
python make_game.py ../games/soko.yaml games/xform soko-text --xform
python make_game.py ../games/soko.yaml games/xform soko --xform --sprites ../games/sprites/soko/soko.yaml
python make_game.py ../games/blockdude.yaml games/xform blockdude-text --xform
python make_game.py ../games/blockdude.yaml games/xform blockdude --xform --sprites ../games/sprites/blockdude/blockdude.yaml
python make_game.py ../games/limerick.yaml games/xform limerick-text --xform
python make_game.py ../games/limerick.yaml games/xform limerick --xform --sprites ../games/sprites/limerick/limerick.yaml
python make_game.py ../games/choice.yaml games/xform cyoa --xform
python make_game.py ../games/lost_and_found.yaml games/xform text-adventure --xform
python make_game.py ../games/rust.yaml games/xform rust-text --xform
python make_game.py ../games/rust.yaml games/xform rust --xform --sprites ../games/sprites/dungeon/rust.yaml
python make_game.py ../games/turn.yaml games/xform turn-text --xform
python make_game.py ../games/turn.yaml games/xform turn --xform --sprites ../games/sprites/turn/turn.yaml
python make_game.py ../games/loop.yaml games/xform loop-text --xform

python make_game.py ../games/ttt.yaml games/unxform ttt-text
python make_game.py ../games/connect4.yaml games/unxform connect4-text
python make_game.py ../games/soko.yaml games/unxform soko-text
python make_game.py ../games/soko.yaml games/unxform soko --sprites ../games/sprites/soko/soko.yaml
