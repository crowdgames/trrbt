.PHONY: all clean pdf png
.SECONDARY:

# Determine the operating system
ifeq ($(OS),Windows_NT)
    # Windows
    RMRF=del /q
else
    # Unix/Linux
    RMRF=rm -rf
endif

GAMES=$(basename $(notdir $(wildcard games/*.yaml)))
OUTFILES=$(addprefix out/, $(addsuffix -unxform, $(GAMES))) \
         $(addprefix out/, $(addsuffix -xform, $(GAMES)))

all: pdf

pdf: $(addsuffix .pdf, $(OUTFILES))

png: $(addsuffix .png, $(OUTFILES))

out:
	mkdir -p out

out/%.pdf: out/%.gv | out
	dot $< -o $@ -Tpdf

out/%.png: out/%.gv | out
	dot $< -o $@ -Gbgcolor=transparent -Gdpi=300 -Tpng

out/%-unxform.gv: games/%.yaml yaml2bt.py util.py | out
	python yaml2bt.py $< --out $@ --resolve

out/%-xform.gv: games/%.yaml yaml2bt.py util.py | out
	python yaml2bt.py $< --out $@ --resolve --xform

clean:
	$(RMRF) out
