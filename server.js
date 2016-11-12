#!/usr/bin/env node

const http = require('http')
const fs = require('fs')
const querystring = require('querystring')
const request = require('request')
const Twitter = require('twitter')
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
    func(...args, (error, ...values) => {
      if (error) {
        reject(error)
      } else {
        resolve(values.length === 1 ? value : values)
      }
    })
  })

const clientPort = parseInt(env('CLIENT_PORT', '8080'), 10)
const serverPort = parseInt(env('SERVER_PORT', '8081'), 10)

const searchInterval = parseInt(env('SEARCH_INTERVAL', '15000'), 10)
const searchQuery = process.argv[2]
const twitterConsumerKey = env('TWITTER_CONSUMER_KEY')
const twitterConsumerSecret = env('TWITTER_CONSUMER_SECRET')

const runClient = () => {
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
  return denodeify(clientServer.listen.bind(clientServer))(clientPort)
    .then(() => {
      console.log(`Client application running on http://localhost:${clientPort}.`)
    })
}

const authenticateWithTwitter = () => {
  const twitterCredentials = Buffer.from(`${encodeURIComponent(twitterConsumerKey)}:${encodeURIComponent(twitterConsumerSecret)}`).toString('base64')
  return new Promise((resolve, reject) => {
    const req = request.post({
      url: 'https://api.twitter.com/oauth2/token',
      headers: {
        'Authorization': `Basic ${twitterCredentials}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    }, (error, response, body) => {
      if (error) {
        return reject(error)
      }
      resolve(JSON.parse(body).access_token)
    })
    req.write('grant_type=client_credentials')
    req.end()
  })
}

const runServer = () => {
  authenticateWithTwitter()
    .then(bearerToken => {
      const twitter = new Twitter({
        consumer_key: twitterConsumerKey,
        consumer_secret: twitterConsumerSecret,
        bearer_token: bearerToken,
      })
      const get = denodeify(twitter.get.bind(twitter))

      const websocketServer = new WebSocketServer({port: serverPort})
      console.log(`Server application running on http://localhost:${serverPort}.`)

      websocketServer.on('connection', client =>
        get('search/tweets', {q: searchQuery, count: 100})
          .then(([_, {body: response}]) => client.send(response))
          .catch(console.error))

      const search = () => {
        console.log(`Searching at ${new Date()}...`)
        return get('search/tweets', {q: searchQuery, count: 100})
          .then(([_, {body: response}]) => {
            websocketServer.clients.forEach(client => {
              client.send(response)
            })
          })
          .then(() => setTimeout(search, searchInterval))
      }
      return search()
    })
}

runClient()
  .then(runServer)
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
