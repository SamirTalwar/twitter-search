# Twitter Search

A simple WebSocket server that searches Twitter and passes back the results.

Set the following environment variables to enable use:
* QUERY = the text search term that you want to search twitter for
* CLIENT_PORT = the port for the client to listen on, defaults to 8080
* SERVER_PORT = the port for the server's websocket connection, defaults to 8081
* SEARCH_INTERVAL = poll time in ms, defaults to 15s (15000 ms)
* TWITTER_CONSUMER_KEY = the Twitter key
* TWITTER_CONSUMER_SECRET = the Twitter secret
