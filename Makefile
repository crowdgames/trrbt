.PHONY: all clean
.SECONDARY:

# Determine the operating system
ifeq ($(OS),Windows_NT)
    # Windows
    RMRF = del /q
else
    # Unix/Linux
    RMRF = rm -rf
endif

all: $(addprefix out/, $(addsuffix -base.pdf, $(basename $(notdir $(shell ls games/*.yaml))))) \
     $(addprefix out/, $(addsuffix -xform.pdf, $(basename $(notdir $(shell ls games/*.yaml)))))

out:
	mkdir -p out

out/%.pdf: out/%.gv | out
	dot $< -Tpdf -o $@

out/%-base.gv: games/%.yaml yaml2bt.py util.py | out
	python yaml2bt.py $< > $@

out/%-xform.gv: games/%.yaml yaml2bt.py util.py | out
	python yaml2bt.py --xform $< > $@

clean:
	$(RMRF) out
