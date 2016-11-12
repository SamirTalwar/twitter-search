#!/usr/bin/env node

const http = require('http')
const fs = require('fs')
const oauth = require('oauth')
const querystring = require('querystring')
const WebSocketServer = require('ws').Server

const env = (name, defaultValue) => {
  const value = process.env[name] || defaultValue
  if (!value) {
    throw new Error(`No such environment variable: ${name}`)
  }
  return value
}

const denodeify = func => (...args) =>
  new Promise((resolve, reject) => {
    func(...args, (error, value) => {
      if (error) {
        reject(error)
      } else {
        resolve(value)
      }
    })
  })

const clientPort = parseInt(env('CLIENT_PORT', '8080'), 10)
const serverPort = parseInt(env('SERVER_PORT', '8081'), 10)

const searchInterval = parseInt(env('SEARCH_INTERVAL', '15000'), 10)
const twitterConsumerKey = env('TWITTER_CONSUMER_KEY')
const twitterConsumerSecret = env('TWITTER_CONSUMER_SECRET')
const twitterSearchUrl = 'https://api.twitter.com/1.1/search/tweets.json?' + querystring.stringify({
  q: process.argv[2],
  count: 100
})

const oa = new oauth.OAuth2(twitterConsumerKey, twitterConsumerSecret, 'https://api.twitter.com/', null, 'oauth2/token', null)
oa.useAuthorizationHeaderforGET(true)
const getOAuthAccessToken = denodeify(oa.getOAuthAccessToken.bind(oa))
const get = denodeify(oa.get.bind(oa))

getOAuthAccessToken('', {'grant_type': 'client_credentials'})
  .then(accessToken => {
    const clientServer = http.createServer((request, response) => {
      if (request.method !== 'GET') {
        response.writeHead(404)
        response.end()
        return
      }

      switch (request.url) {
        case '/':
          fs.createReadStream('client.html').pipe(response)
          break
        case '/app.css':
          fs.createReadStream('app.css').pipe(response)
          break
        case '/client.js':
          fs.createReadStream('client.js').pipe(response)
          break
        case '/load.js':
          fs.createReadStream('load.js').pipe(response)
          break
        default:
          response.writeHead(404)
          response.end()
          break
      }
    })
    clientServer.listen(clientPort)
    console.log(`Client application running on http://localhost:${clientPort}.`)

    const websocketServer = new WebSocketServer({port: serverPort})
    console.log(`Server application running on http://localhost:${serverPort}.`)

    const search = () => {
      console.log('Searching...')
      return get(twitterSearchUrl, accessToken)
        .then(data => {
          websocketServer.clients.forEach(client => {
            client.send(data)
          })
        })
        .then(() => setTimeout(search, searchInterval))
    }
    return search()
  })
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
