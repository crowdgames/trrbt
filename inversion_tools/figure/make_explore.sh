if [ -z "$1" ]; then
    echo "usage: make_explore.sh [path/to/sturgeon]"
    exit
fi

set -ex

rm -rf out/explore
mkdir -p out/explore

for game in merge twodoor peg_solitaire sokoban; do
    mkdir -p out/explore/tmp
    PIPENV_PIPFILE="$1/Pipfile" pipenv run python "$1/jsons2levels.py" --outfile out/explore/tmp/tmp --jsonsfile ../out/${game}/inverted/enum_boards.jsons --keys board main
    PIPENV_PIPFILE="$1/Pipfile" pipenv run python "$1/input2tile.py" --outfile out/explore/tmp/tmp.tile --textfile out/explore/tmp/tmp_*.json
    PIPENV_PIPFILE="$1/Pipfile" pipenv run python "$1/levels2explore.py" --outfile out/explore/tmp/tmp.ex --tilefile out/explore/tmp/tmp.tile
    PIPENV_PIPFILE="$1/Pipfile" pipenv run python "$1/explore2pdf.py" --outfile "out/explore/explore-${game}-main.pdf" --explorefile out/explore/tmp/tmp.ex --text --layout tree-sqrt --cfgfile level2image-cfg.json
    rm -rf out/explore/tmp
done
