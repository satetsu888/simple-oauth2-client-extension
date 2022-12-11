declare type ClientType = 'public' | 'confidential'
declare type PKCEParam = 'S256' | 'plain' | 'no'
declare type TokenEndPointAuthMethod = 'client_secret_basic' | 'client_secret_post'

declare type InputParams = {
    authorizationEndpoint: string;
    tokenEndpoint: string;
    clientType: ClientType;
    clientId: string;
    clientSecret: string;
    scope: string;
    redirectUri: string;
    pkceParam: PKCEParam,
    tokenEndpointAuthMethod: TokenEndPointAuthMethod,
};