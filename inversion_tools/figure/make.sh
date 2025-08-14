if [ -z "$1" ]; then
    echo "usage: make.sh [path/to/level2image]"
    exit
fi

set -ex

rm -rf out
mkdir -p out/board
mkdir -p out/tree

cp gen/*.json out/board/
cp ../inputs/*.json out/board/

PIPENV_PIPFILE="$1/Pipfile" pipenv run python "$1/level2image.py" --cfg level2image-cfg.json --tile-norect --suffix "" out/board/*.json

rm -f out/board/*.json

files=(peg_solitaire merge sokoban twodoor)
names=("Peg Solitaire" "Merge" "Sokoban" "TwoDoor")

for ii in "${!files[@]}"; do
    file="${files[ii]}"
    name="${names[ii]}"
    python "../../yaml2bt.py" "../inputs/${file}-gameloop.yaml" --out "out/tree/${file}-forward.json" --resolve --xform --fmt json --name "${name}:forward"
    cat "../inputs/${file}-gameloop.yaml" | sed '/x-spin/,+1 d' > out/tree/${file}-gameloop-trim.yaml
    python "../../yaml2bt.py" "out/tree/${file}-gameloop-trim.yaml" --out "out/tree/${file}-forward-trim.json" --resolve --xform --fmt json --name "${name}:forward"
done

python ../invert_tree.py "Peg Solitaire:inverted" out/tree/peg_solitaire-forward.json out/tree/peg_solitaire-inverted.json

cp program/*.gv out/tree/

for json in `ls out/tree/*.json`; do
    python ../../yaml2bt.py "${json}" --out "${json%.*}.gv" --fmt gv
    if [[ $json == *-trim.json ]]; then
	cat  "${json%.*}.gv" | sed 's/}/  2000000 [shape="box", label=<. . .>, fontsize="30pt", shape=plaintext]; 1000003 -> 2000000 [style="invis"];\n}/g' >  "${json%.*}.gv.tmp"
	mv  "${json%.*}.gv.tmp" "${json%.*}.gv"
    fi
done

for gv in `ls out/tree/*.gv`; do
    dot -Tpdf "${gv}" -o "${gv%.*}.pdf"
done

rm -f out/tree/*.json
rm -f out/tree/*.gv
