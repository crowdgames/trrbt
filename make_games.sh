set -ex

rm -rf docs/games
mkdir -p docs/games

bash script/game_cvt.sh --fmt js-entry --folder games/trees --game new_game.json >> docs/games/games.js

bash script/game_cvt.sh --fmt js-entry --folder games/trees --game soko-emoji.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game soko2.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game soko_quest-emoji.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game soko_quest-emoji-incomplete.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game soko_enemy-emoji-incomplete.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game sweeper.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game lights_out.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game conway.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game soko-demo.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game soko_enemy-incomplete.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game tm-parens.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game trogue.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game checkers.json --sprites games/sprites/checkers/checkers.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game choice.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game tic-tac-toe.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game connect_four-text.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game connect_four-emoji.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game sokoban~gameloop.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game sokoban~level1.json --sprites games/sprites/soko/soko.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game lost_and_found.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game rust.json --sprites games/sprites/dungeon/rust.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game turn.json --sprites games/sprites/turn/turn.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game loop.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game dungeon.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game dungeon~patrol.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game dungeon~chase.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game ca.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game right~gameloop.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game right~boards.json >> docs/games/games.js

bash script/game_cvt.sh --fmt js-entry --folder games/trees --game block_dude.json --sprites games/sprites/block_dude/block_dude.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game block_dude~mechanics.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-000.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-001.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-002.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-003.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-004.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-005.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-006.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-007.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-008.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-009.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-010.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game block_dude~levels/block_dude-011.json >> docs/games/games.js

bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick.json --sprites games/sprites/limerick/limerick.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_mechanics.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_1.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_2.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_3.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_4.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_5.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_6.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_7.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_8.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_9.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_10.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_11.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_12.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_13.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_14.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_15.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_16.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_17.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_18.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_19.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_20.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_21.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_22.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_23.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_24.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_25.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_26.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_27.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_28.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_29.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_30.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --folder games/trees --game limerick_levels/limerick_31.json >> docs/games/games.js
