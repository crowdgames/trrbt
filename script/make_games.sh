cd $( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/..

set -ex

rm -rf docs/games
mkdir -p docs/games

python script/copy_game.py docs/games/games.js games_json new_game.json
python script/copy_game.py docs/games/games.js games_json connect4-emoji.json
python script/copy_game.py docs/games/games.js games_json soko-emoji.json
python script/copy_game.py docs/games/games.js games_json soko2.json
python script/copy_game.py docs/games/games.js games_json soko_quest-emoji.json
python script/copy_game.py docs/games/games.js games_json soko_quest-emoji-incomplete.json
python script/copy_game.py docs/games/games.js games_json soko_enemy-emoji-incomplete.json
python script/copy_game.py docs/games/games.js games_json sweeper.json
python script/copy_game.py docs/games/games.js games_json lights_out.json
python script/copy_game.py docs/games/games.js games_json conway.json
python script/copy_game.py docs/games/games.js games_json soko-demo.json
python script/copy_game.py docs/games/games.js games_json soko_enemy-incomplete.json
python script/copy_game.py docs/games/games.js games_json tm-parens.json
python script/copy_game.py docs/games/games.js games_json trogue.json

python script/make_game.py docs/games/games.js games_yaml ttt.yaml
python script/make_game.py docs/games/games.js games_yaml connect4.yaml
python script/make_game.py docs/games/games.js games_yaml checkers.yaml --sprites sprites/checkers/checkers.yaml
python script/make_game.py docs/games/games.js games_yaml sokoban-gameloop.yaml
python script/make_game.py docs/games/games.js games_yaml sokoban-level1.yaml --sprites sprites/soko/soko.yaml
python script/make_game.py docs/games/games.js games_yaml choice.yaml
python script/make_game.py docs/games/games.js games_yaml lost_and_found.yaml
python script/make_game.py docs/games/games.js games_yaml rust.yaml --sprites sprites/dungeon/rust.yaml
python script/make_game.py docs/games/games.js games_yaml turn.yaml --sprites sprites/turn/turn.yaml
python script/make_game.py docs/games/games.js games_yaml loop.yaml
python script/make_game.py docs/games/games.js games_yaml dungeon.yaml
python script/make_game.py docs/games/games.js games_yaml dungeon_patrol.yaml
python script/make_game.py docs/games/games.js games_yaml dungeon_chase.yaml
python script/make_game.py docs/games/games.js games_yaml ca.yaml
python script/make_game.py docs/games/games.js games_yaml right-gameloop.yaml
python script/make_game.py docs/games/games.js games_yaml right-boards.yaml

python script/make_game.py docs/games/games.js games_yaml blockdude.yaml --sprites sprites/blockdude/blockdude.yaml
python script/make_game.py docs/games/games.js games_yaml blockdude_mechanics.yaml
python script/make_game.py docs/games/games.js games_yaml blockdude_levels/blockdude_0.yaml
python script/make_game.py docs/games/games.js games_yaml blockdude_levels/blockdude_1.yaml
python script/make_game.py docs/games/games.js games_yaml blockdude_levels/blockdude_2.yaml
python script/make_game.py docs/games/games.js games_yaml blockdude_levels/blockdude_3.yaml
python script/make_game.py docs/games/games.js games_yaml blockdude_levels/blockdude_4.yaml
python script/make_game.py docs/games/games.js games_yaml blockdude_levels/blockdude_5.yaml
python script/make_game.py docs/games/games.js games_yaml blockdude_levels/blockdude_6.yaml
python script/make_game.py docs/games/games.js games_yaml blockdude_levels/blockdude_7.yaml
python script/make_game.py docs/games/games.js games_yaml blockdude_levels/blockdude_8.yaml
python script/make_game.py docs/games/games.js games_yaml blockdude_levels/blockdude_9.yaml
python script/make_game.py docs/games/games.js games_yaml blockdude_levels/blockdude_10.yaml
python script/make_game.py docs/games/games.js games_yaml blockdude_levels/blockdude_11.yaml

python script/make_game.py docs/games/games.js games_yaml limerick.yaml --sprites sprites/limerick/limerick.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_mechanics.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_1.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_2.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_3.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_4.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_5.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_6.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_7.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_8.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_9.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_10.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_11.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_12.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_13.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_14.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_15.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_16.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_17.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_18.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_19.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_20.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_21.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_22.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_23.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_24.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_25.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_26.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_27.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_28.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_29.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_30.yaml
python script/make_game.py docs/games/games.js games_yaml limerick_levels/limerick_31.yaml
