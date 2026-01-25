set -ex

rm -rf viz
mkdir -p viz

mkdir -p viz/gv
mkdir -p viz/pdf
##mkdir -p viz/png

for game in `ls games/trees | grep '\.json$'`; do
    game=${game%.json}

    bash script/game_convert.sh --game games/trees/${game}.json --out viz/gv/${game}--unxform.gv --fmt gv --resolve
    bash script/game_convert.sh --game games/trees/${game}.json --out viz/gv/${game}--xform.gv --fmt gv --resolve --xform

    dot viz/gv/${game}--unxform.gv -o viz/pdf/${game}--unxform.pdf -Tpdf
    dot viz/gv/${game}--xform.gv -o viz/pdf/${game}--xform.pdf -Tpdf

    ##dot viz/gv/${game}--unxform.gv -o viz/pdf/${game}--unxform.png -Tpng -Gbgcolor=transparent -Gdpi=300
    ##dot viz/gv/${game}--xform.gv -o viz/pdf/${game}--xform.png -Tpng -Gbgcolor=transparent -Gdpi=300
done
