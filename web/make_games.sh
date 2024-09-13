set -ex

rm -rf games
mkdir -p games

python copy_game.py games/games.js games_web new_game.json
python copy_game.py games/games.js games_web connect4-emoji.json
python copy_game.py games/games.js games_web soko-emoji.json
python copy_game.py games/games.js games_web soko2.json
python copy_game.py games/games.js games_web soko_quest-emoji.json
python copy_game.py games/games.js games_web soko_quest-emoji-incomplete.json
python copy_game.py games/games.js games_web soko_enemy-emoji-incomplete.json
python copy_game.py games/games.js games_web sweeper.json

python make_game.py games/games.js ../games ttt.yaml
python make_game.py games/games.js ../games connect4.yaml
python make_game.py games/games.js ../games checkers.yaml --sprites sprites/checkers/checkers.yaml
python make_game.py games/games.js ../games soko.yaml --sprites sprites/soko/soko.yaml
python make_game.py games/games.js ../games choice.yaml
python make_game.py games/games.js ../games lost_and_found.yaml
python make_game.py games/games.js ../games rust.yaml --sprites sprites/dungeon/rust.yaml
python make_game.py games/games.js ../games turn.yaml --sprites sprites/turn/turn.yaml
python make_game.py games/games.js ../games loop.yaml
python make_game.py games/games.js ../games dungeon.yaml
python make_game.py games/games.js ../games dungeon_patrol.yaml
python make_game.py games/games.js ../games dungeon_chase.yaml
python make_game.py games/games.js ../games ca.yaml

python make_game.py games/games.js ../games blockdude.yaml --sprites sprites/blockdude/blockdude.yaml
python make_game.py games/games.js ../games blockdude_mechanics.yaml
python make_game.py games/games.js ../games blockdude_levels/blockdude_0.yaml
python make_game.py games/games.js ../games blockdude_levels/blockdude_1.yaml
python make_game.py games/games.js ../games blockdude_levels/blockdude_2.yaml
python make_game.py games/games.js ../games blockdude_levels/blockdude_3.yaml
python make_game.py games/games.js ../games blockdude_levels/blockdude_4.yaml
python make_game.py games/games.js ../games blockdude_levels/blockdude_5.yaml
python make_game.py games/games.js ../games blockdude_levels/blockdude_6.yaml
python make_game.py games/games.js ../games blockdude_levels/blockdude_7.yaml
python make_game.py games/games.js ../games blockdude_levels/blockdude_8.yaml
python make_game.py games/games.js ../games blockdude_levels/blockdude_9.yaml
python make_game.py games/games.js ../games blockdude_levels/blockdude_10.yaml
python make_game.py games/games.js ../games blockdude_levels/blockdude_11.yaml

python make_game.py games/games.js ../games limerick.yaml --sprites sprites/limerick/limerick.yaml
python make_game.py games/games.js ../games limerick_mechanics.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_1.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_2.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_3.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_4.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_5.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_6.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_7.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_8.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_9.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_10.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_11.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_12.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_13.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_14.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_15.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_16.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_17.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_18.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_19.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_20.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_21.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_22.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_23.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_24.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_25.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_26.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_27.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_28.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_29.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_30.yaml
python make_game.py games/games.js ../games limerick_levels/limerick_31.yaml
