const generateCodeVerifier = (n = 43) => {
  const S = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~';

  return Array.from(crypto.getRandomValues(new Uint32Array(n)))
    .map((v) => S[v % S.length])
    .join('');
};

async function generateCodeChallenge(codeVerifier) {
    var digest = await crypto.subtle.digest("SHA-256",
      new TextEncoder().encode(codeVerifier));
  
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function createURLSearchParams(data) {
    const params = new URLSearchParams();
    Object.keys(data).forEach(key => params.append(key, data[key]));
    return params;
}
