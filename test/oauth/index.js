const SPENDGO_OAUTH_API_KEY = ''
const SPENDGO_OAUTH_URL     = ''                    // using in oauth
const SPENDGO_REDIRECT_URI  = ''  // using in oauth

const spendgo     = require('../../spendgo')
const faker       = require('faker')
const querystring = require('querystring') // for Spendgo SSO url
const express     = require('express')
const app         = express()

let randomString = faker.random.alphaNumeric(32)
let queryStr     = querystring.encode({
  response_type: 'code',
  scope        : 'user_profile',
  state        : randomString,
  client_id    : SPENDGO_OAUTH_API_KEY,
  redirect_uri : SPENDGO_REDIRECT_URI
})
let oauthUrl = `${SPENDGO_OAUTH_URL}/oauth2/v1/auth?${queryStr}`

app.get('/', (req, res)=>{
  res.send(`<a href="${oauthUrl}">Login with Spendgo SSO</a><p>NOTE: when you create an account, must VERIFY email before login.</p>`)
})

app.get('/oauth/redirecturl', async (req, res)=> {
  if (req.query.state !== randomString) {
    console.log('warning! callback state do NOT match with sending state.')
    res.end()
  }

  let authorizationCode = req.query.code

  // get access token using authorization code
  let tmp = await spendgo.oauthExchangeForToken(authorizationCode) // {status:200, result:{access_token:000}}
  let accessToken = tmp.result.access_token

  // get a Spendgo member infomation using access token
  let userInfo = await spendgo.oauthRetrieveMember(accessToken)
  res.send(userInfo)
})

app.listen(8000, ()=>{console.log('Express started on port 8000')})
