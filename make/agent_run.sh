set -ex

time bash script/game_agent.sh --game games/trees/tic-tac-toe.json

time bash script/game_agent.sh --game games/trees/dungeon.json

time bash script/game_agent.sh --game games/trees/sokoban~small.json

time bash script/game_agent.sh --game games/trees/peg_solitaire~boards.json
time bash script/game_agent.sh --game games/trees/peg_solitaire~gameloop.json --board '{"main": [["O", "O", "_", "O", "_", "O"]]}'
time bash script/game_agent.sh --game games/trees/peg_solitaire~gameloop.json --board '{"main": [["O", "O", "_", "O", "_", "O"]]}' --enumerate

time bash script/game_agent.sh --game games/trees/rush_hour~boards.json

time bash script/game_agent.sh --game games/trees/eights~boards.json
time bash script/game_agent.sh --game games/trees/eights~shuffle.json

time bash script/game_agent.sh --game games/trees/right~boards.json
time bash script/game_agent.sh --game games/trees/right~boards.json --enumerate
time bash script/game_agent.sh --game games/trees/right~gameloop.json --board '{"main": [["P", "_", "_", "_", "_", "_", "D"]]}'
time bash script/game_agent.sh --game games/trees/right~gameloop.json --board '{"main": [["P", "_", "_", "_", "_", "_", "D"]]}' --enumerate
