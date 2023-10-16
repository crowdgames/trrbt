.PHONY: all clean
.SECONDARY:

all: \
	out/ttt-base.pdf out/ttt-xform.pdf \
	out/connect-base.pdf out/connect-xform.pdf \
	out/rushhour-base.pdf out/rushhour-xform.pdf \
	out/checkers-base.pdf out/checkers-xform.pdf \
	out/platform-base.pdf out/platform-xform.pdf

out:
	mkdir -p out

out/%.pdf: out/%.gv | out
	dot $< -Tpdf -o $@

out/%-base.gv: games/%.yaml yaml2bt.py | out
	python3 yaml2bt.py $< > $@

out/%-xform.gv: games/%.yaml yaml2bt.py | out
	python3 yaml2bt.py --xform $< > $@

clean:
	rm -rf out
