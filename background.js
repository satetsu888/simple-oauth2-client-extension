importScripts('utils.js')

const log = (string) => {
    chrome.runtime.sendMessage({
        action: "log",
        value: string,
    }, () => {});
}

const buildAuthorizationUrl = async (params, PKCECodeVerifier) => {
  const authorizationEndpoint = params['authorization_endpoint']
  const clientId = params['client_id']
  const scope = params['scope']
  const redirectUri = params['redirect_uri']
  const pkceParam = params['pkce']

  const url = new URL(authorizationEndpoint)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', 'state')
  url.searchParams.set('scope', scope)
  if (pkceParam === 'S256') {
      const codeChallenge = await generateCodeChallenge(PKCECodeVerifier)
      url.searchParams.set('code_challenge_method', 'S256')
      url.searchParams.set('code_challenge', codeChallenge)
  } else if (pkceParam === 'plain') {
      url.searchParams.set('code_challenge_method', 'plain')
      url.searchParams.set('code_challenge', PKCECodeVerifier)
  } else if (pkceParam === 'no') {
    // do nothing
  } else {
    log(`[error] unknown pkce param: ${pkceParam}`)
  }

  return url.toString()
}

const auth = async(params) => {
  log(`params: ${JSON.stringify(params)}`)
  const authorizationEndpoint = params['authorization_endpoint']
  const tokenEndpoint = params['token_endpoint']

  const clientType = params['client_type']
  const clientId = params['client_id']
  const clientSecret = params['client_secret']
  const scope = params['scope']
  const redirectUri = params['redirect_uri']

  const pkceParam = params['pkce']
  const tokenRequstAuth = params['token_request_auth']

  const PKCECodeVerifier = generateCodeVerifier()
  log(`generate code_verifier: ${PKCECodeVerifier}`)
  const authorizationUrl = await buildAuthorizationUrl(params, PKCECodeVerifier)
  log(`build authorizationUrl: ${authorizationUrl}`)

  chrome.identity.launchWebAuthFlow({
      url: authorizationUrl,
      interactive: true
  }, async function(callbackUrlString) {
      log(`callbacked url: ${callbackUrlString}`)
      const callbackUrl = new URL(callbackUrlString);
      const code = callbackUrl.searchParams.get('code');
      log(`code: ${code}`)

      const body = createURLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          redirect_uri: redirectUri,
          code: code,
      })
      if (pkceParam !== 'no') {
        body.append('code_verifier', PKCECodeVerifier)
      }

      var response
      if (clientType === 'public') {
          response = await publicClientTokenRequest(tokenEndpoint, body)
      } else if (clientType === 'confidential') {
          response = await confidentialClientTokenRequest(tokenEndpoint, clientId, clientSecret, body, tokenRequstAuth)
      } else {
          log(`[error] unknown client type: ${clientType}`)
      }

      try {
        JSON.stringify(response)
      } catch (e) {
        log(`[error] got malformed json response: ${response}, error: ${e}`)
      }

      chrome.runtime.sendMessage({
          action: "result",
          value: JSON.stringify(response),
      }, () => {});
  });
}

const publicClientTokenRequest = async(tokenEndpoint, body) => {
    log(`token request body for public client: ${body}`)
    const data = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
        },
        body: body.toString(),
    }).then(response => response.json()).then(data => {
        return data
    })
    return data
}

const confidentialClientTokenRequest = async(tokenEndpoint, clientId, clientSecret, body, tokenRequstAuth) => {
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
    }

    if (tokenRequstAuth === 'header') {
        const authHeader = 'Basic ' + btoa(`${clientId}:${clientSecret}`);
        log(`using Authorization header: ${authHeader}`)
        headers['Authorization'] = authHeader
    } else if (tokenRequstAuth === 'body') {
        log(`set authorization params in body`)
        body.append('client_secret', clientSecret)
    } else {
        log(`[error] unknown token request auth: ${tokenRequstAuth}`)
    }

    log(`token request body for confidential client: ${body}`)
    const data = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: headers,
        body: body.toString(),
    }).then(response => response.json()).then(data => {
        return data
    })
    return data
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "submit") {
      auth(message.value).catch((error) => {
        log(`[error] ${error}`)
      })
    }
    return true
});