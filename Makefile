SRC := $(wildcard *.js *.html *.css)
BUILDDIR := build
OBJS = $(addprefix $(BUILDDIR)/,$(SRC))

$(BUILDDIR)/%.js: %.js .babelrc
	babel $< -o $@

$(BUILDDIR)/%.html: %.html
	cp $< $@

$(BUILDDIR)/%.css: %.css
	cp $< $@

all: $(OBJS)

$(OBJS): | $(BUILDDIR)

$(BUILDDIR):
	mkdir -p $(BUILDDIR)
