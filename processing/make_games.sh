rm -rf games
mkdir -p games

python yaml2json.py ../games/ttt.yaml games/ttt-text
python yaml2json.py ../games/connect4.yaml games/connect4-text
python yaml2json.py ../games/checkers.yaml games/checkers --sprites ../games/sprites/checkers/checkers.yaml
python yaml2json.py ../games/blockdude.yaml games/blockdude-text
python yaml2json.py ../games/blockdude.yaml games/blockdude --sprites ../games/sprites/blockdude/blockdude.yaml
python yaml2json.py ../games/dungeon_patrol.yaml games/dungeon_patrol-text
python yaml2json.py ../games/dungeon_patrol.yaml games/dungeon_patrol --sprites ../games/sprites/dungeon/dungeon.yaml
python yaml2json.py ../games/dungeon_chase.yaml games/dungeon_chase --sprites ../games/sprites/dungeon/dungeon.yaml
python yaml2json.py ../games/soko.yaml games/soko --sprites ../games/sprites/soko/soko.yaml
python yaml2json.py ../games/rust.yaml games/rust-text
python yaml2json.py ../games/rust.yaml games/rust --sprites ../games/sprites/dungeon/rust.yaml
python yaml2json.py ../games/turn.yaml games/turn-text
python yaml2json.py ../games/turn.yaml games/turn --sprites ../games/sprites/turn/turn.yaml
