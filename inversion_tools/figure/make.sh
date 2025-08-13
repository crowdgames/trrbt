if [ -z "$1" ]; then
    echo "usage: make.sh [path/to/level2image]"
    exit
fi

set -ex

PIPENV_PIPFILE="$1/Pipfile" pipenv run python "$1/level2image.py" --cfg level2image-cfg.json --tile-norect --suffix "" gen/*.json
PIPENV_PIPFILE="$1/Pipfile" pipenv run python "$1/level2image.py" --cfg level2image-cfg.json --tile-norect --suffix "" ../inputs/*.json
mv ../inputs/*.pdf inputs/

python ../../yaml2bt.py ../inputs/peg_solitaire-gameloop.yaml --out program/peg_solitaire-forward.json --resolve --xform --fmt json --name "Peg Solitaire:forward"
python ../../yaml2bt.py program/peg_solitaire-forward.json --out program/peg_solitaire-forward.gv --fmt gv

python ../invert_tree.py "Peg Solitaire:inverted" program/peg_solitaire-forward.json program/peg_solitaire-inverted.json
python ../../yaml2bt.py program/peg_solitaire-inverted.json --out program/peg_solitaire-inverted.gv --fmt gv

for gv in `ls program/*.gv`; do
    dot -Tpdf "${gv}" -o "${gv%.*}.pdf"
done
