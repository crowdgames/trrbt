set -e

rm -rf games
mkdir -p games

cat games_web/connect4-emoji.js      >> games/games.js
cat games_web/soko-emoji.js          >> games/games.js
cat games_web/soko2.js               >> games/games.js
cat games_web/tutorial-complete.js   >> games/games.js
cat games_web/tutorial-incomplete.js >> games/games.js

python make_game.py games/games.js ../games ttt.yaml
python make_game.py games/games.js ../games connect4.yaml
python make_game.py games/games.js ../games checkers.yaml --sprites sprites/checkers/checkers.yaml
python make_game.py games/games.js ../games soko.yaml --sprites sprites/soko/soko.yaml
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
python make_game.py games/games.js ../games choice.yaml
python make_game.py games/games.js ../games lost_and_found.yaml
python make_game.py games/games.js ../games rust.yaml --sprites sprites/dungeon/rust.yaml
python make_game.py games/games.js ../games turn.yaml --sprites sprites/turn/turn.yaml
python make_game.py games/games.js ../games loop.yaml
python make_game.py games/games.js ../games dungeon.yaml
python make_game.py games/games.js ../games dungeon_patrol.yaml
python make_game.py games/games.js ../games dungeon_chase.yaml
