import * as React from 'react'
import { useRef, useState, useEffect } from 'react';

type Props = {}

const Panel = (props: Props) => {
  const [authorizationEndpoint, setAuthorizationEndpoint] = useState<string>("")
  const [tokenEndpoint, setTokenEndpoint] = useState<string>("")
  const [clientType, setClientType] = useState<ClientType>("public")
  const [clientId, setClientId] = useState<string>("")
  const [clientSecret, setClientSecret] = useState<string>("")
  const [scope, setScope] = useState<string>("")
  const [redirectUri, _] = useState<string>(`https://${chrome.runtime.id}.chromiumapp.org/`)
  const [pkceParam, setPkceParam] = useState<PKCEParam>("S256")
  const [tokenEndpointAuthMethod, setTokenEndpointAuthMethod] = useState<TokenEndPointAuthMethod>("client_secret_basic")

  const [copyButtonText, setCopyButtonText] = useState("copy")

  const [log, setLog] = useState<string>("")
  const [result, setResult] = useState<string>("")

  const redirectUriInputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTimeout(() => {
      setCopyButtonText("copy")
    }, 1000)
  }, [copyButtonText])

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log(message);

      if (message.action === "log") {
        setLog((prev) => {
          return prev + message.value + "\n";
        });
      } else if (message.action === "result") {
        setResult(message.value);
      }

      return true;
    });

    return () => {
      chrome.runtime.onMessage.removeListener(() => {});
    }
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [log]);

  return (
    <>
      <form
        id="form"
        onSubmit={(e) => {
          e.preventDefault();

          setLog("");
          setResult("");

         const params = {
           authorizationEndpoint,
           tokenEndpoint,
           clientType,
           clientId,
           clientSecret,
           scope,
           redirectUri,
           pkceParam,
           tokenEndpointAuthMethod,
         };
         chrome.runtime.sendMessage(
           {
             action: "submit",
             value: params,
           },
           () => {}
         );
        }}
      >
        <fieldset>
          <legend>API Information</legend>
          <div>
            <label htmlFor="authorization_endpoint">
              Authorization Endpoint
            </label>
            <input
              type="url"
              name="authorization_endpoint"
              placeholder="https://example.com/authrize"
              size={40}
              form="form"
              required
              value={authorizationEndpoint}
              onChange={(e) => setAuthorizationEndpoint(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="token_endpoint">Token Endpoint</label>
            <input
              type="url"
              name="token_endpoint"
              placeholder="https://api.example.com/token"
              size={40}
              required
              value={tokenEndpoint}
              onChange={(e) => setTokenEndpoint(e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset>
          <legend>Client Config</legend>
          <div>
            Client Type
            <input
              type="radio"
              id="client_type_public"
              name="client_type"
              value="public"
              checked={clientType === "public"}
              onChange={() => setClientType("public")}
            />
            <label htmlFor="client_type_public">Public</label>
            <input
              type="radio"
              id="client_type_confidential"
              name="client_type"
              value="confidential"
              checked={clientType === "confidential"}
              onChange={() => setClientType("confidential")}
            />
            <label htmlFor="client_type_confidential">Confidential</label>
          </div>

          <div>
            <label htmlFor="client_id">Client ID</label>
            <input
              type="text"
              name="client_id"
              size={30}
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
              }}
            />
          </div>

          <div>
            <label htmlFor="client_secret">Client Secret</label>
            <input
              type="text"
              name="client_secret"
              size={30}
              value={clientSecret}
              onChange={(e) => {
                setClientSecret(e.target.value);
              }}
            />
          </div>

          <div>
            <label htmlFor="scope">scope</label>
            <input
              type="text"
              name="scope"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value);
              }}
            />
          </div>

          <div>
            <label htmlFor="redirect_uri">redirect_uri</label>
            <input
              ref={redirectUriInputRef}
              type="text"
              id="redirect_uri"
              name="redirect_uri"
              value={redirectUri}
              readOnly
              size={50}
            />
            <button
              id="copy_redirect_uri_button"
              type="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                redirectUriInputRef.current?.select();
                redirectUriInputRef.current?.setSelectionRange(0, 99999);
                document.execCommand("copy");

                setCopyButtonText("copied!");
              }}
            >
              {copyButtonText}
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Request Config</legend>
          <div>
            PKCE
            <input
              type="radio"
              id="pkce_s256"
              name="pkce"
              value="S256"
              checked={pkceParam === "S256"}
              onChange={() => setPkceParam("S256")}
            />
            <label htmlFor="pkce_s256">S256</label>
            <input
              type="radio"
              id="pkce_plain"
              name="pkce"
              value="plain"
              checked={pkceParam === "plain"}
              onChange={() => setPkceParam("plain")}
            />
            <label htmlFor="pkce_plain">plain</label>
            <input
              type="radio"
              id="pkce_no"
              name="pkce"
              value="no"
              checked={pkceParam === "no"}
              onChange={() => setPkceParam("no")}
            />
            <label htmlFor="pkce_no">not use</label>
          </div>

          <div>
            Auth Method
            <input
              type="radio"
              id="token_endpoint_auth_method_client_secret_basic"
              name="token_endpoint_auth_method"
              value="client_secret_basic"
              checked={tokenEndpointAuthMethod === "client_secret_basic"}
              onChange={() => setTokenEndpointAuthMethod("client_secret_basic")}
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
              onChange={() => setTokenEndpointAuthMethod("client_secret_post")}
            />
            <label htmlFor="token_endpoint_auth_method_client_secret_post">
              Client Secret Post (Body Parameter)
            </label>
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

        <input type="submit" id="submit" value="Start Auth" />
      </form>
      <br />
      <br />
      log
      <div>
        <textarea id="log" cols={60} rows={10} value={log} ref={logRef} />
        <div>result</div>
        <textarea id="result" cols={60} rows={4} value={result} />
      </div>
    </>
  );
}

export default Panel