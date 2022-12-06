export const generateCodeVerifier = (n: number = 43) => {
  const S = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~';

  return Array.from(crypto.getRandomValues(new Uint32Array(n)))
    .map((v) => S[v % S.length])
    .join('');
};

export const generateCodeChallenge = async (codeVerifier: string) => {
    var digest = await crypto.subtle.digest("SHA-256",
      new TextEncoder().encode(codeVerifier));
  
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export const createURLSearchParams = (data: {[key: string]: string}) => {
    const params = new URLSearchParams();
    Object.keys(data).forEach(key => params.append(key, data[key]));
    return params;
}
