.PHONY: all clean
.SECONDARY:

# Determine the operating system
ifeq ($(OS),Windows_NT)
    # Windows
    RM = del /q
    PYTHON = python
else
    # Unix/Linux
    RM = rm -rf
    PYTHON = python3
endif

all: \
	out/ttt-base.pdf out/ttt-xform.pdf \
	out/connect-base.pdf out/connect-xform.pdf \
	out/rushhour-base.pdf out/rushhour-xform.pdf \
	out/checkers-base.pdf out/checkers-xform.pdf \
	out/platform-base.pdf out/platform-xform.pdf \
	out/eights-base.pdf out/eights-xform.pdf

out:
	mkdir -p out

out/%.pdf: out/%.gv | out
	dot $< -Tpdf -o $@

out/%-base.gv: games/%.yaml yaml2bt.py util.py | out
	python yaml2bt.py $< > $@

out/%-xform.gv: games/%.yaml yaml2bt.py util.py | out
	python yaml2bt.py --xform $< > $@

clean:
	$(RM) out
