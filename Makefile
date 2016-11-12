elm := $(shell command -v elm)
node := $(shell command -v node)
websocketd := $(shell command -v websocketd)

ifndef elm
$(error 'This application requires `elm`, `node` and `websocketd`. Please install them before running.')
endif

ifndef node
$(error 'This application requires `elm`, `node` and `websocketd`. Please install them before running.')
endif

ifndef websocketd
$(error 'This application requires `elm`, `node` and `websocketd`. Please install them before running.')
endif

run:
	./server "$$QUERY"
