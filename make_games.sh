set -ex

rm -rf docs/games
mkdir -p docs/games

bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game new_game.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game connect4-emoji.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game soko-emoji.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game soko2.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game soko_quest-emoji.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game soko_quest-emoji-incomplete.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game soko_enemy-emoji-incomplete.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game sweeper.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game lights_out.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game conway.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game soko-demo.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game soko_enemy-incomplete.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game tm-parens.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game trogue.json >> docs/games/games.js

bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game ttt.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game connect4.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game checkers.json --sprites games/sprites/checkers/checkers.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game sokoban-gameloop.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game sokoban-level1.json --sprites games/sprites/soko/soko.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game choice.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game lost_and_found.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game rust.json --sprites games/sprites/dungeon/rust.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game turn.json --sprites games/sprites/turn/turn.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game loop.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game dungeon.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game dungeon_patrol.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game dungeon_chase.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game ca.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game right-gameloop.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game right-boards.json >> docs/games/games.js

bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game blockdude.json --sprites games/sprites/blockdude/blockdude.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game blockdude_mechanics.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game blockdude_levels/blockdude_0.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game blockdude_levels/blockdude_1.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game blockdude_levels/blockdude_2.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game blockdude_levels/blockdude_3.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game blockdude_levels/blockdude_4.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game blockdude_levels/blockdude_5.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game blockdude_levels/blockdude_6.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game blockdude_levels/blockdude_7.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game blockdude_levels/blockdude_8.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game blockdude_levels/blockdude_9.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game blockdude_levels/blockdude_10.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game blockdude_levels/blockdude_11.json >> docs/games/games.js

bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick.json --sprites games/sprites/limerick/limerick.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_mechanics.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_1.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_2.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_3.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_4.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_5.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_6.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_7.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_8.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_9.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_10.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_11.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_12.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_13.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_14.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_15.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_16.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_17.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_18.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_19.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_20.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_21.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_22.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_23.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_24.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_25.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_26.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_27.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_28.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_29.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_30.json >> docs/games/games.js
bash script/game_cvt.sh --fmt js-entry --gamefolder games/trees --game limerick_levels/limerick_31.json >> docs/games/games.js
