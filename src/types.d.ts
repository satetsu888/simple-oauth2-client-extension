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

declare type FormFieldInfo = {
    selector: string;
    tagName: string;
    type: string;
    name: string;
    id: string;
    placeholder: string;
    label: string;
};

declare type PageFormSnapshot = {
    url: string;
    title: string;
    content: string;
    formFields: FormFieldInfo[];
};

declare type SuggestableFieldValues = {
    authorizationEndpoint: string;
    tokenEndpoint: string;
    clientId: string;
    clientSecret: string;
    scope: string;
};

declare type ExtensionMessage =
    | { action: "submit"; value: AuthInputParams }
    | { action: "log"; value: string }
    | { action: "result"; value: string }
    | { action: "ai-check-availability" }
    | { action: "ai-prepare" }
    | { action: "ai-model-ready" }
    | { action: "ai-analyze"; value: PageFormSnapshot }
    | { action: "ai-status"; value: string }
    | { action: "ai-download-progress"; value: number }
    | { action: "ai-result"; value: AiSuggestions }
    | { action: "ai-error"; value: string };

declare type AiSuggestions = {
    authorizationEndpoint?: string;
    tokenEndpoint?: string;
    clientId?: string;
    clientSecret?: string;
    scope?: string;
    redirectUriFieldSelector?: string;
    warnings: string[];
};