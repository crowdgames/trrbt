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

GAMES=$(basename $(notdir $(wildcard games_yaml/*.yaml)))
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

out/%-unxform.gv: games_yaml/%.yaml script/yaml2bt.py script/util.py | out
	python script/yaml2bt.py $< --out $@ --fmt gv --resolve

out/%-xform.gv: games_yaml/%.yaml script/yaml2bt.py script/util.py | out
	python script/yaml2bt.py $< --out $@ --fmt gv --resolve --xform

clean:
	$(RMRF) out
