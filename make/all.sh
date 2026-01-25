set -ex

bash make/rename.sh
bash make/games.sh
bash make/viz.sh
bash make/agent_run.sh

if [ "$1" == "-v" ]; then
    bash make/cat.sh
fi
