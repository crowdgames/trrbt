set -ex

echo "--- games/trees/tic-tac-toe.json ---"
bash script/game_agent.sh --game games/trees/tic-tac-toe.json

echo "--- games/trees/dungeon.json ---"
bash script/game_agent.sh --game games/trees/dungeon.json

echo "--- games/trees/sokoban~small.json ---"
bash script/game_agent.sh --game games/trees/sokoban~small.json

echo "--- games/trees/merge~boards.json ---"
bash script/game_agent.sh --game games/trees/merge~boards.json

echo "--- games/trees/twodoor~boards.json ---"
bash script/game_agent.sh --game games/trees/twodoor~boards.json

echo "--- games/trees/peg_solitaire~boards.json ---"
bash script/game_agent.sh --game games/trees/peg_solitaire~boards.json
echo "--- games/trees/peg_solitaire~gameloop.json ---"
bash script/game_agent.sh --game games/trees/peg_solitaire~gameloop.json --board '{"main": [["O", "O", "_", "O", "_", "O"]]}'
echo "--- games/trees/peg_solitaire~gameloop.json ---"
bash script/game_agent.sh --game games/trees/peg_solitaire~gameloop.json --board '{"main": [["O", "O", "_", "O", "_", "O"]]}' --enumerate

echo "--- games/trees/rush_hour~boards.json ---"
bash script/game_agent.sh --game games/trees/rush_hour~boards.json
echo "--- games/trees/rush_hour~random.json ---"
bash script/game_agent.sh --game games/trees/rush_hour~random.json

echo "--- games/trees/eights~boards.json ---"
bash script/game_agent.sh --game games/trees/eights~boards.json
echo "--- games/trees/eights~boards.json ---"
bash script/game_agent.sh --game games/trees/eights~shuffle.json

echo "--- games/trees/right~boards.json ---"
bash script/game_agent.sh --game games/trees/right~boards.json
echo "--- games/trees/right~boards.json ---"
bash script/game_agent.sh --game games/trees/right~boards.json --enumerate
echo "--- games/trees/right~gameloop.json ---"
bash script/game_agent.sh --game games/trees/right~gameloop.json --board '{"main": [["P", "_", "_", "_", "_", "_", "D"]]}'
echo "--- games/trees/right~gameloop.json ---"
bash script/game_agent.sh --game games/trees/right~gameloop.json --board '{"main": [["P", "_", "_", "_", "_", "_", "D"]]}' --enumerate
