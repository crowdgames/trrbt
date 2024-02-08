rm -rf games
mkdir -p games

python yaml2json.py ../games/ttt.yaml games/ttt-text
python yaml2json.py ../games/connect4.yaml games/connect4-text
python yaml2json.py ../games/checkers.yaml games/checkers --sprites ../games/sprites/checkers/checkers.yaml
python yaml2json.py ../games/dungeon_patrol.yaml games/dungeon_patrol-text
python yaml2json.py ../games/dungeon_patrol.yaml games/dungeon_patrol --sprites ../games/sprites/dungeon/dungeon.yaml
python yaml2json.py ../games/dungeon_chase.yaml games/dungeon_chase --sprites ../games/sprites/dungeon/dungeon.yaml
python yaml2json.py ../games/rust.yaml games/rust --sprites ../games/sprites/dungeon/rust.yaml
python yaml2json.py ../games/blockdude_levels.yaml games/blockdude_levels --sprites ../games/sprites/blockdude/blockdude.yaml
