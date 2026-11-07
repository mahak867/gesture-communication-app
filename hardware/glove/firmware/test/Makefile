# Host-side checks for the glove firmware (no ESP32 toolchain needed).
#   make -C hardware/glove/firmware/test        → unit tests + golden vectors + sketch compile check
CXX ?= g++
FLAGS = -std=c++17 -Wall -Wextra -Werror
SKETCH = ../gesturetalk_glove

all: test vectors sketch

test_frame: test_frame.cpp $(SKETCH)/glove_frame.h
	$(CXX) $(FLAGS) -o $@ test_frame.cpp

test: test_frame
	./test_frame

vectors: test_frame
	./test_frame vectors.json

# Type-check the whole sketch against stub Arduino/BLE headers.
sketch:
	$(CXX) $(FLAGS) -Wno-unused-parameter -fsyntax-only -Istubs -I$(SKETCH) -x c++ $(SKETCH)/gesturetalk_glove.ino
	@echo "sketch: compiles against stub headers"

clean:
	rm -f test_frame

.PHONY: all test vectors sketch clean
