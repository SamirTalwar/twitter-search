#!/usr/bin/env node

const oauth = require('oauth')
const querystring = require('querystring')

const env = name => {
  const value = process.env[name]
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

const twitterConsumerKey = env('TWITTER_CONSUMER_KEY')
const twitterConsumerSecret = env('TWITTER_CONSUMER_SECRET')

const oa = new oauth.OAuth2(twitterConsumerKey, twitterConsumerSecret, 'https://api.twitter.com/', null, 'oauth2/token', null)

denodeify(oa.getOAuthAccessToken.bind(oa))('', {'grant_type': 'client_credentials'})
  .then(accessToken => {
    oa.useAuthorizationHeaderforGET(true)

    const endpoint = 'https://api.twitter.com/1.1/search/tweets.json'
    const url = endpoint + '?' + querystring.stringify({
      q: process.argv[2],
      count: 100
    })
    process.stderr.write('Searching...\n')
    return denodeify(oa.get.bind(oa))(url, accessToken)
  })
  .then(data => {
    console.log(data)
  })
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
