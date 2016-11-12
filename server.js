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

const twitterConsumerKey = env('TWITTER_CONSUMER_KEY')
const twitterConsumerSecret = env('TWITTER_CONSUMER_SECRET')

const oa = new oauth.OAuth2(
  twitterConsumerKey,
  twitterConsumerSecret,
  'https://api.twitter.com/',
  null,
  'oauth2/token',
  null)
oa.getOAuthAccessToken(
  '',
  {'grant_type': 'client_credentials'},
  (error, accessToken, refreshToken, results) => {
    if (error) {
      console.error(error)
      process.exitCode = 1
      return
    }

    oa.useAuthorizationHeaderforGET(true)

    const endpoint = 'https://api.twitter.com/1.1/search/tweets.json'
    const url = endpoint + '?' + querystring.stringify({
      q: process.argv[2],
      count: 100
    })
    process.stderr.write('Searching...\n')
    oa.get(url, accessToken, (error, data) => {
      if (error) {
        console.error(error)
        process.exitCode = 1
        return
      }

      console.log(data)
    })
  })
