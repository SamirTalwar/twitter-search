elm := $(shell command -v elm)
node := $(shell command -v node)

ifndef elm
$(error 'This application requires `elm` and `node`. Please install them before running.')
endif

ifndef node
$(error 'This application requires `elm` and `node`. Please install them before running.')
endif

build: client.js

client.js: Client.elm
	$(elm) make --output=$@ $^

run:
	./server.js "$$QUERY"
