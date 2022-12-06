declare type PKCEParam = 'S256' | 'plain' | 'no'
declare type TokenRequestAuth = 'header' | 'body'

declare type InputParams = {
    authorizationEndpoint: string;
    tokenEndpoint: string;
    clientType: string;
    clientId: string;
    clientSecret: string;
    scope: string;
    redirectUri: string;
    pkceParam: PKCEParam,
    tokenRequestAuth: TokenRequestAuth,
};