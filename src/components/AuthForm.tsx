import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import SuggestionTip from './SuggestionTip'
import RedirectUriInjector from './RedirectUriInjector'

type Props = {
  config: AuthFormConfig
  redirectUri: string
  suggestions?: AiSuggestions | null
  fieldValues: SuggestableFieldValues
  appliedFields: Set<string>
  onFieldChange: (field: keyof SuggestableFieldValues, value: string) => void
  onAppliedFieldAdd: (field: string) => void
  onSubmit: (params: AuthInputParams) => void
  onInjectRedirectUri?: (selector: string) => void
}

const AuthForm = (props: Props) => {
  const {
    config, redirectUri, suggestions,
    fieldValues, appliedFields, onFieldChange, onAppliedFieldAdd,
    onSubmit, onInjectRedirectUri,
  } = props;

  const [clientType, setClientType] = useState<ClientType>(config.clientTypesSupported[0]);
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
          onSubmit({
            authorizationEndpoint: config.authorizationEndpoint || fieldValues.authorizationEndpoint,
            tokenEndpoint: config.tokenEndpoint || fieldValues.tokenEndpoint,
            clientType,
            clientId: fieldValues.clientId,
            clientSecret: fieldValues.clientSecret,
            scope: fieldValues.scope,
            redirectUri,
            codeChallengeMethod,
            tokenEndpointAuthMethod,
          });
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
              <span className="input-with-suggestion">
                <input
                  type="url"
                  name="authorization_endpoint"
                  placeholder="https://example.com/authrize"
                  size={40}
                  form="form"
                  required
                  value={config.authorizationEndpoint || fieldValues.authorizationEndpoint}
                  onChange={(e) => onFieldChange('authorizationEndpoint', e.target.value)}
                  readOnly={config.authorizationEndpoint !== null}
                />
                {suggestions?.authorizationEndpoint && config.authorizationEndpoint === null && !appliedFields.has('authorizationEndpoint') && (
                  <SuggestionTip
                    suggestion={suggestions.authorizationEndpoint}
                    onApply={(v) => { onFieldChange('authorizationEndpoint', v); onAppliedFieldAdd('authorizationEndpoint'); }}
                  />
                )}
              </span>
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
              <span className="input-with-suggestion">
                <input
                  type="url"
                  name="token_endpoint"
                  placeholder="https://api.example.com/token"
                  size={40}
                  required
                  value={config.tokenEndpoint || fieldValues.tokenEndpoint}
                  onChange={(e) => onFieldChange('tokenEndpoint', e.target.value)}
                  readOnly={config.tokenEndpoint !== null}
                />
                {suggestions?.tokenEndpoint && config.tokenEndpoint === null && !appliedFields.has('tokenEndpoint') && (
                  <SuggestionTip
                    suggestion={suggestions.tokenEndpoint}
                    onApply={(v) => { onFieldChange('tokenEndpoint', v); onAppliedFieldAdd('tokenEndpoint'); }}
                  />
                )}
              </span>
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
              <span className="input-with-suggestion">
                <input
                  type="text"
                  name="client_id"
                  size={40}
                  value={fieldValues.clientId}
                  onChange={(e) => onFieldChange('clientId', e.target.value)}
                />
                {suggestions?.clientId && !appliedFields.has('clientId') && (
                  <SuggestionTip
                    suggestion={suggestions.clientId}
                    onApply={(v) => { onFieldChange('clientId', v); onAppliedFieldAdd('clientId'); }}
                  />
                )}
              </span>
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
              <span className="input-with-suggestion">
                <input
                  type="text"
                  name="client_secret"
                  size={40}
                  value={fieldValues.clientSecret}
                  onChange={(e) => onFieldChange('clientSecret', e.target.value)}
                />
                {suggestions?.clientSecret && !appliedFields.has('clientSecret') && (
                  <SuggestionTip
                    suggestion={suggestions.clientSecret}
                    onApply={(v) => { onFieldChange('clientSecret', v); onAppliedFieldAdd('clientSecret'); }}
                  />
                )}
              </span>
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
              <span className="input-with-suggestion">
                <input
                  type="text"
                  name="scope"
                  value={fieldValues.scope}
                  size={40}
                  onChange={(e) => onFieldChange('scope', e.target.value)}
                />
                {suggestions?.scope && !appliedFields.has('scope') && (
                  <SuggestionTip
                    suggestion={suggestions.scope}
                    onApply={(v) => { onFieldChange('scope', v); onAppliedFieldAdd('scope'); }}
                  />
                )}
              </span>
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
              <span className="input-with-suggestion">
                <input
                  ref={redirectUriInputRef}
                  type="text"
                  id="redirect_uri"
                  name="redirect_uri"
                  value={redirectUri}
                  readOnly
                  size={40}
                  style={{
                    backgroundColor: "lightgray",
                    border: "1px solid lightgray",
                  }}
                />
                {suggestions?.redirectUriField && !appliedFields.has('redirectUriField') && onInjectRedirectUri && (
                  <RedirectUriInjector
                    selector={suggestions.redirectUriField.selector}
                    onInject={(selector) => {
                      onInjectRedirectUri(selector);
                      onAppliedFieldAdd('redirectUriField');
                    }}
                  />
                )}
              </span>
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
