declare type ClientType = 'public' | 'confidential'
declare type CodeChallengeMethod = 'S256' | 'plain' | 'no'
declare type TokenEndPointAuthMethod = 'client_secret_basic' | 'client_secret_post' | 'none'

declare type OAuthMetaData = {
    issuer: string;
    authorizationEndpoint: string | null;
    tokenEndpoint: string | null;
    jwksUri?: string;
    registrationEndpoint?: string;
    scopesSupported?: string[];
    responseTypesSupported: string[];
    responseModesSupporteds?: string[]; // If omitted, the default is "["query", "fragment"]"
    grantTypesSupported?: string[]; // If omitted, the default value is "["authorization_code", "implicit"]"
    tokenEndpointAuthMethodsSupported?: TokenEndPointAuthMethod[]; // If omitted, the default is "client_secret_basic"
    tokenEndpointAuthSigningAlgValuesSupported?: string[]; // If omitted, the default is "RS256"
    serviceDocumentation?: string;
    uiLocalesSupported?: string[];
    opPolicyUri?: string;
    opTosUri?: string;
    revocationEndpoint?: string;
    revocationEndpointAuthMethodsSupported?: string[];
    revocationEndpointAuthSigningAlgValuesSupported?: string[];
    introspectionEndpoint?: string;
    introspectionEndpointAuthMethodsSupported?: string[];
    introspectionEndpointAuthSigningAlgValuesSupported?: string[];
    codeChallengeMethodsSupported?: CodeChallengeMethod[]; // If omitted, not supported
}

declare type AuthFormConfig = {
    name: string;
    authorizationEndpoint: string | null;
    tokenEndpoint: string | null;
    clientTypesSupported: ClientType[];
    scopesSupported: string[] | null;
    codeChallengeMethodSupported: CodeChallengeMethod[],
    tokenEndpointAuthMethodSupported: TokenEndPointAuthMethod[],
}

declare type AuthInputParams = {
    authorizationEndpoint: string;
    tokenEndpoint: string;
    clientType: ClientType;
    clientId: string;
    clientSecret: string;
    scope: string;
    redirectUri: string;
    codeChallengeMethod: CodeChallengeMethod,
    tokenEndpointAuthMethod: TokenEndPointAuthMethod,
};