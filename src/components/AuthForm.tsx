import * as React from 'react'
import { useEffect, useRef, useState } from 'react'

type Props = {
  config: AuthFormConfig
  redirectUri: string
  onSubmit: (params: AuthInputParams) => void
}

const AuthForm = (props: Props) => {
  const { config, redirectUri: defaultRedirectUri, onSubmit } = props;

  const [authorizationEndpoint, setAuthorizationEndpoint] = useState<string>(config.authorizationEndpoint ?? "");
  const [tokenEndpoint, setTokenEndpoint] = useState<string>(config.tokenEndpoint ?? "");
  const [clientType, setClientType] = useState<ClientType>(config.clientTypesSupported[0]);
  const [clientId, setClientId] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [scope, setScope] = useState<string>(config.scopesSupported ? config.scopesSupported[0] : "");
  const [redirectUri, _] = useState<string>(defaultRedirectUri);
  const [codeChallengeMethod, setCodeChallengeMethod] = useState<CodeChallengeMethod>(config.codeChallengeMethodSupported[0]);
  const [tokenEndpointAuthMethod, setTokenEndpointAuthMethod] = useState<TokenEndPointAuthMethod>(config.tokenEndpointAuthMethodSupported[0]);

  const [copyButtonText, setCopyButtonText] = useState("copy");

  const redirectUriInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => {
      setCopyButtonText("copy");
    }, 1000);
  }, [copyButtonText]);

  return (
    <>
      <form
        id="form"
        onSubmit={(e) => {
          e.preventDefault();

          const params = {
            authorizationEndpoint:
              config.authorizationEndpoint || authorizationEndpoint,
            tokenEndpoint: config.tokenEndpoint || tokenEndpoint,
            clientType,
            clientId,
            clientSecret,
            scope,
            redirectUri,
            codeChallengeMethod,
            tokenEndpointAuthMethod,
          };
          onSubmit(params);
        }}
      >
        <fieldset style={{ marginTop: "4px", marginBottom: "4px" }}>
          <legend>API Information</legend>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              alignItems: "baseline",
              justifyItems: "start",
            }}
          >
            <div>
              <label htmlFor="authorization_endpoint">
                Authorization Endpoint
              </label>
            </div>
            <div
              style={{
                marginLeft: "8px",
                marginTop: "1px",
                marginBottom: "1px",
              }}
            >
              <input
                type="url"
                name="authorization_endpoint"
                placeholder="https://example.com/authrize"
                size={40}
                form="form"
                required
                value={config.authorizationEndpoint || authorizationEndpoint}
                onChange={(e) => setAuthorizationEndpoint(e.target.value)}
                readOnly={config.authorizationEndpoint !== null}
              />
            </div>

            <div>
              <label htmlFor="token_endpoint">Token Endpoint</label>
            </div>
            <div
              style={{
                marginLeft: "8px",
                marginTop: "1px",
                marginBottom: "1px",
              }}
            >
              <input
                type="url"
                name="token_endpoint"
                placeholder="https://api.example.com/token"
                size={40}
                required
                value={config.tokenEndpoint || tokenEndpoint}
                onChange={(e) => setTokenEndpoint(e.target.value)}
                readOnly={config.tokenEndpoint !== null}
              />
            </div>
          </div>
        </fieldset>

        <fieldset style={{ marginTop: "4px", marginBottom: "4px" }}>
          <legend>Client Config</legend>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              alignItems: "baseline",
              justifyItems: "start",
            }}
          >
            <div>Client Type</div>
            <div
              style={{
                marginLeft: "8px",
                marginTop: "1px",
                marginBottom: "1px",
              }}
            >
              <input
                type="radio"
                id="client_type_public"
                name="client_type"
                value="public"
                checked={clientType === "public"}
                onChange={() => setClientType("public")}
                disabled={!config.clientTypesSupported.includes("public")}
              />
              <label htmlFor="client_type_public">Public</label>
              <input
                type="radio"
                id="client_type_confidential"
                name="client_type"
                value="confidential"
                checked={clientType === "confidential"}
                onChange={() => setClientType("confidential")}
                disabled={!config.clientTypesSupported.includes("confidential")}
              />
              <label htmlFor="client_type_confidential">Confidential</label>
            </div>

            <div>
              <label htmlFor="client_id">Client ID</label>
            </div>
            <div
              style={{
                marginLeft: "8px",
                marginTop: "1px",
                marginBottom: "1px",
              }}
            >
              <input
                type="text"
                name="client_id"
                size={40}
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                }}
              />
            </div>

            <div>
              <label htmlFor="client_secret">Client Secret</label>
            </div>
            <div
              style={{
                marginLeft: "8px",
                marginTop: "1px",
                marginBottom: "1px",
              }}
            >
              <input
                type="text"
                name="client_secret"
                size={40}
                value={clientSecret}
                onChange={(e) => {
                  setClientSecret(e.target.value);
                }}
              />
            </div>

            <div>
              <label htmlFor="scope">scope</label>
            </div>
            <div
              style={{
                marginLeft: "8px",
                marginTop: "1px",
                marginBottom: "1px",
              }}
            >
              <input
                type="text"
                name="scope"
                value={scope}
                size={40}
                onChange={(e) => {
                  setScope(e.target.value);
                }}
              />
            </div>

            <div>
              <label htmlFor="redirect_uri">redirect_uri</label>
            </div>
            <div
              style={{
                marginLeft: "8px",
                marginTop: "1px",
                marginBottom: "1px",
              }}
            >
              <input
                ref={redirectUriInputRef}
                type="text"
                id="redirect_uri"
                name="redirect_uri"
                value={redirectUri}
                readOnly
                size={35}
                style={{
                  backgroundColor: "lightgray",
                  border: "1px solid lightgray",
                }}
              />
              <button
                id="copy_redirect_uri_button"
                type="button"
                onClick={(
                  e: React.MouseEvent<HTMLButtonElement, MouseEvent>
                ) => {
                  redirectUriInputRef.current?.select();
                  redirectUriInputRef.current?.setSelectionRange(0, 99999);
                  document.execCommand("copy");

                  setCopyButtonText("copied!");
                }}
                style={{
                  marginLeft: "8px",
                }}
              >
                {copyButtonText}
              </button>
            </div>
          </div>
        </fieldset>

        <fieldset style={{ marginTop: "4px", marginBottom: "4px" }}>
          <legend>Request Config</legend>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              alignItems: "baseline",
              justifyItems: "start",
            }}
          >
            <div>PKCE</div>
            <div
              style={{
                marginLeft: "8px",
                marginTop: "1px",
                marginBottom: "1px",
              }}
            >
              <input
                type="radio"
                id="pkce_s256"
                name="pkce"
                value="S256"
                checked={codeChallengeMethod === "S256"}
                onChange={() => setCodeChallengeMethod("S256")}
                disabled={!config.codeChallengeMethodSupported.includes("S256")}
              />
              <label htmlFor="pkce_s256">S256</label>
              <input
                type="radio"
                id="pkce_plain"
                name="pkce"
                value="plain"
                checked={codeChallengeMethod === "plain"}
                onChange={() => setCodeChallengeMethod("plain")}
                disabled={
                  !config.codeChallengeMethodSupported.includes("plain")
                }
              />
              <label htmlFor="pkce_plain">plain</label>
              <input
                type="radio"
                id="pkce_no"
                name="pkce"
                value="no"
                checked={codeChallengeMethod === "no"}
                onChange={() => setCodeChallengeMethod("no")}
                disabled={!config.codeChallengeMethodSupported.includes("no")}
              />
              <label htmlFor="pkce_no">not use</label>
            </div>

            <div>Auth Method</div>
            <div
              style={{
                marginLeft: "8px",
                marginTop: "1px",
                marginBottom: "1px",
              }}
            >
              <input
                type="radio"
                id="token_endpoint_auth_method_client_secret_basic"
                name="token_endpoint_auth_method"
                value="client_secret_basic"
                checked={tokenEndpointAuthMethod === "client_secret_basic"}
                onChange={() =>
                  setTokenEndpointAuthMethod("client_secret_basic")
                }
                disabled={
                  !config.tokenEndpointAuthMethodSupported.includes(
                    "client_secret_basic"
                  )
                }
              />
              <label htmlFor="token_endpoint_auth_method_client_secret_basic">
                Client Secret Basic (Authorization Header)
              </label>
              <input
                type="radio"
                id="token_endpoint_auth_method_client_secret_post"
                name="token_endpoint_auth_method"
                value="client_secret_post"
                checked={tokenEndpointAuthMethod === "client_secret_post"}
                onChange={() =>
                  setTokenEndpointAuthMethod("client_secret_post")
                }
                disabled={
                  !config.tokenEndpointAuthMethodSupported.includes(
                    "client_secret_post"
                  )
                }
              />
              <label htmlFor="token_endpoint_auth_method_client_secret_post">
                Client Secret Post (Body Parameter)
              </label>
            </div>
          </div>

          {/* 
          <div>
            <input type="checkbox" id="use_curl" name="use_curl" disabled />
            <label htmlFor="use_curl">
              Show TokenRequest cURL command (not implemented yet...)
            </label>
          </div>
            */}
        </fieldset>

        <input
          type="submit"
          id="submit"
          value="Start Auth"
        />
      </form>
    </>
  );
};

export default AuthForm;