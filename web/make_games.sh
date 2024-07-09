set -e

rm -rf games
mkdir -p games

python make_game.py ../games/ttt.yaml games/ttt-text
python make_game.py ../games/connect4.yaml games/connect4-text
python make_game.py ../games/checkers.yaml games/checkers-text
python make_game.py ../games/checkers.yaml games/checkers --sprites ../games/sprites/checkers/checkers.yaml
python make_game.py ../games/soko.yaml games/soko-text
python make_game.py ../games/soko.yaml games/soko --sprites ../games/sprites/soko/soko.yaml
python make_game.py ../games/blockdude.yaml games/blockdude-text
python make_game.py ../games/blockdude.yaml games/blockdude --sprites ../games/sprites/blockdude/blockdude.yaml
python make_game.py ../games/limerick.yaml games/limerick-text
python make_game.py ../games/limerick.yaml games/limerick --sprites ../games/sprites/limerick/limerick.yaml
python make_game.py ../games/choice.yaml games/cyoa
python make_game.py ../games/lost_and_found.yaml games/text-adventure
python make_game.py ../games/rust.yaml games/rust-text
python make_game.py ../games/rust.yaml games/rust --sprites ../games/sprites/dungeon/rust.yaml
python make_game.py ../games/turn.yaml games/turn-text
python make_game.py ../games/turn.yaml games/turn --sprites ../games/sprites/turn/turn.yaml
python make_game.py ../games/loop.yaml games/loop-text
