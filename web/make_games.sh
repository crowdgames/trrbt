set -e

rm -rf games
mkdir -p games
mkdir -p games/blockdude_levels
mkdir -p games/limerick_levels

python make_game.py ../games/ttt.yaml games ttt-text
python make_game.py ../games/connect4.yaml games connect4-text
python make_game.py ../games/checkers.yaml games checkers-text
python make_game.py ../games/checkers.yaml games checkers --sprites ../games/sprites/checkers/checkers.yaml
python make_game.py ../games/soko.yaml games soko-text
python make_game.py ../games/soko.yaml games soko --sprites ../games/sprites/soko/soko.yaml
python make_game.py ../games/blockdude.yaml games blockdude --sprites ../games/sprites/blockdude/blockdude.yaml
python make_game.py ../games/blockdude_mechanics.yaml games blockdude_mechanics
python make_game.py ../games/blockdude_levels/blockdude_0.yaml games blockdude_levels/blockdude_0
python make_game.py ../games/blockdude_levels/blockdude_1.yaml games blockdude_levels/blockdude_1
python make_game.py ../games/blockdude_levels/blockdude_2.yaml games blockdude_levels/blockdude_2
python make_game.py ../games/blockdude_levels/blockdude_3.yaml games blockdude_levels/blockdude_3
python make_game.py ../games/blockdude_levels/blockdude_4.yaml games blockdude_levels/blockdude_4
python make_game.py ../games/blockdude_levels/blockdude_5.yaml games blockdude_levels/blockdude_5
python make_game.py ../games/blockdude_levels/blockdude_6.yaml games blockdude_levels/blockdude_6
python make_game.py ../games/blockdude_levels/blockdude_7.yaml games blockdude_levels/blockdude_7
python make_game.py ../games/blockdude_levels/blockdude_8.yaml games blockdude_levels/blockdude_8
python make_game.py ../games/blockdude_levels/blockdude_9.yaml games blockdude_levels/blockdude_9
python make_game.py ../games/blockdude_levels/blockdude_10.yaml games blockdude_levels/blockdude_10
python make_game.py ../games/blockdude_levels/blockdude_11.yaml games blockdude_levels/blockdude_11
python make_game.py ../games/limerick.yaml games limerick --sprites ../games/sprites/limerick/limerick.yaml
python make_game.py ../games/limerick_mechanics.yaml games limerick_mechanics
python make_game.py ../games/limerick_levels/limerick_1.yaml games limerick_levels/limerick_1
python make_game.py ../games/limerick_levels/limerick_2.yaml games limerick_levels/limerick_2
python make_game.py ../games/limerick_levels/limerick_3.yaml games limerick_levels/limerick_3
python make_game.py ../games/limerick_levels/limerick_4.yaml games limerick_levels/limerick_4
python make_game.py ../games/limerick_levels/limerick_5.yaml games limerick_levels/limerick_5
python make_game.py ../games/limerick_levels/limerick_6.yaml games limerick_levels/limerick_6
python make_game.py ../games/limerick_levels/limerick_7.yaml games limerick_levels/limerick_7
python make_game.py ../games/limerick_levels/limerick_8.yaml games limerick_levels/limerick_8
python make_game.py ../games/limerick_levels/limerick_9.yaml games limerick_levels/limerick_9
python make_game.py ../games/choice.yaml games cyoa
python make_game.py ../games/lost_and_found.yaml games text-adventure
python make_game.py ../games/rust.yaml games rust-text
python make_game.py ../games/rust.yaml games rust --sprites ../games/sprites/dungeon/rust.yaml
python make_game.py ../games/turn.yaml games turn-text
python make_game.py ../games/turn.yaml games turn --sprites ../games/sprites/turn/turn.yaml
python make_game.py ../games/loop.yaml games loop-text
python make_game.py ../games/dungeon.yaml games dungeon
python make_game.py ../games/dungeon_patrol.yaml games dungeon_patrol
python make_game.py ../games/dungeon_chase.yaml games dungeon_chase
