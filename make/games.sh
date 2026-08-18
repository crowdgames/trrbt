set -ex

rm -rf docs/games
mkdir -p docs/games

bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game new_game.json

bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game ca.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game checkers.json --sprites games/sprites/checkers/checkers.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game choice.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game connect_four-emoji.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game connect_four-text.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game conway.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game dungeon.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game dungeon~patrol.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game dungeon~chase.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game kirsch-triangle.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lights_out.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game loop.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lost_and_found.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game right~gameloop.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game right~boards.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game rust.json --sprites games/sprites/dungeon/rust.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game soko-emoji.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game soko_quest-emoji.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game soko_quest-emoji-incomplete.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game soko_enemy-emoji-incomplete.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game soko-demo.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game soko_enemy-incomplete.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game soko2.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game sokoban~gameloop.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game sokoban~level1.json --sprites games/sprites/soko/soko.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game sweeper.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game tic-tac-toe.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game tm-parens.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game trogue.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game trogue-2.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game trogue-mini.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game turn.json --sprites games/sprites/turn/turn.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game wfc-test.json --sprites games/sprites/wfc-test/wfc-test.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game x-unroll-replace-switches.json

bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game block_dude.json --sprites games/sprites/block_dude/block_dude.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game block_dude~mechanics.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-000.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-001.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-002.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-003.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-004.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-005.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-006.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-007.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-008.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-009.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-010.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-011.json

bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick.json --sprites games/sprites/lime_rick/lime_rick.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~mechanics.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-001.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-002.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-003.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-004.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-005.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-006.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-007.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-008.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-009.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-010.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-011.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-012.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-013.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-014.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-015.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-016.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-017.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-018.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-019.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-020.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-021.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-022.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-023.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-024.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-025.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-026.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-027.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-028.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-029.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-030.json
bash script/game_convert.sh --out docs/games/games.js --append --fmt js-entry --folder games/trees --game lime_rick~levels/lime_rick-031.json
