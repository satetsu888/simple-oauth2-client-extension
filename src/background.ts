import { generateCodeVerifier, generateCodeChallenge, createURLSearchParams } from './utils'

const backgroundLog = (string: string): void => {
    chrome.runtime.sendMessage({
        action: "log",
        value: string,
    }, () => {});
}

const buildAuthorizationUrl = async (params: InputParams, PKCECodeVerifier: string) => {
  const url = new URL(params.authorizationEndpoint)
  url.searchParams.set('client_id', params.clientId)
  url.searchParams.set('redirect_uri', params.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', 'state')
  url.searchParams.set('scope', params.scope)
  if (params.pkceParam === 'S256') {
      const codeChallenge = await generateCodeChallenge(PKCECodeVerifier)
      url.searchParams.set('code_challenge_method', 'S256')
      url.searchParams.set('code_challenge', codeChallenge)
  } else if (params.pkceParam === 'plain') {
      url.searchParams.set('code_challenge_method', 'plain')
      url.searchParams.set('code_challenge', PKCECodeVerifier)
  } else if (params.pkceParam === 'no') {
    // do nothing
  } else {
    backgroundLog(`[error] unknown pkce param: ${params.pkceParam}`)
  }

  return url.toString()
}

const auth = async(params: InputParams) => {
  backgroundLog(`params: ${JSON.stringify(params)}`)

  const PKCECodeVerifier = generateCodeVerifier()
  backgroundLog(`generate code_verifier: ${PKCECodeVerifier}`)
  const authorizationUrl = await buildAuthorizationUrl(params, PKCECodeVerifier)
  backgroundLog(`build authorizationUrl: ${authorizationUrl}`)

  chrome.identity.launchWebAuthFlow({
      url: authorizationUrl,
      interactive: true
  }, async (callbackUrlString) => {
      if (callbackUrlString === undefined) {
        backgroundLog("[error] callbackUrlString is undefined")
        return
      } else {
        backgroundLog(`callbacked url: ${callbackUrlString}`)
      }
      const callbackUrl = new URL(callbackUrlString);
      const code = callbackUrl.searchParams.get('code');
      if (code === null) {
        backgroundLog("[error] code is null")
        return
      } else {
        backgroundLog(`code: ${code}`)
      }

      const body = createURLSearchParams({
          grant_type: 'authorization_code',
          client_id: params.clientId,
          redirect_uri: params.redirectUri,
          code: code,
      })
      if (params.pkceParam !== 'no') {
        body.append('code_verifier', PKCECodeVerifier)
      }

      var response
      if (params.clientType === 'public') {
          response = await publicClientTokenRequest(params.tokenEndpoint, body)
      } else if (params.clientType === 'confidential') {
          response = await confidentialClientTokenRequest(
            params.tokenEndpoint,
            params.clientId,
            params.clientSecret,
            body,
            params.tokenRequestAuth
          );
      } else {
          backgroundLog(`[error] unknown client type: ${params.clientType}`)
      }

      try {
        JSON.stringify(response)
      } catch (e) {
        backgroundLog(`[error] got malformed json response: ${response}, error: ${e}`)
      }

      chrome.runtime.sendMessage({
          action: "result",
          value: JSON.stringify(response),
      }, () => {});
  });
}

const publicClientTokenRequest = async(tokenEndpoint: string, body: URLSearchParams) => {
    backgroundLog(`token request body for public client: ${body}`)
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

const confidentialClientTokenRequest = async(tokenEndpoint: string, clientId: string, clientSecret: string, body: URLSearchParams, tokenRequstAuth: string) => {
    const headers: {[key: string]: string} = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
    }

    if (tokenRequstAuth === 'header') {
        const authHeader = 'Basic ' + btoa(`${clientId}:${clientSecret}`);
        backgroundLog(`using Authorization header: ${authHeader}`)
        headers['Authorization'] = authHeader
    } else if (tokenRequstAuth === 'body') {
        backgroundLog(`set authorization params in body`)
        body.append('client_secret', clientSecret)
    } else {
        backgroundLog(`[error] unknown token request auth: ${tokenRequstAuth}`)
    }

    backgroundLog(`token request body for confidential client: ${body}`)
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
        backgroundLog(`[error] ${error}`)
      })
    }
    return true
});