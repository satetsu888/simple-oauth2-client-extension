import * as React from 'react'
import { useRef, useState, useEffect } from 'react';
import AuthForm from './AuthForm';

type Props = {}

const Panel = (props: Props) => {
  const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`

  const defaultConfig: AuthFormConfig = {
    name: "CustomProvider",
    authorizationEndpoint: null,
    tokenEndpoint: null,
    clientTypesSupported: ["public", "confidential"],
    scopesSupported: null,
    codeChallengeMethodSupported: ["S256", "plain", "no"],
    tokenEndpointAuthMethodSupported: ["client_secret_basic", "client_secret_post"],
  }

  const [platformConfigMap, setPlatformConfigMap] = useState<Map<string, AuthFormConfig>>(new Map([[defaultConfig.name, defaultConfig]]))
  const [authConfig, setAuthConfig] = useState<AuthFormConfig>(defaultConfig)

  const [log, setLog] = useState<string>("")
  const [result, setResult] = useState<string>("")
  const logRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log(message);

      if (message.action === "log") {
        setLog((prev) => {
          return prev + message.value + "\n";
        });
        logRef.current?.scrollTo(0, logRef.current.scrollHeight);
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
    (async () => {
      const metadataRes = await fetch("https://raw.githubusercontent.com/satetsu888/simple-oauth2-client-extension/main/api/platform_metadata.json")
      const metaJson = await metadataRes.json()

      const configs: AuthFormConfig[] = await Promise.all(metaJson.map(async(platform: any): Promise<AuthFormConfig> => {
        const configRes = await fetch(platform.metadata)
        const configJson = await configRes.json()
        return {
          name: platform.name,
          authorizationEndpoint: configJson.authorization_endpoint,
          tokenEndpoint: configJson.token_endpoint,
          clientTypesSupported: configJson.client_types_supported || ["public", "confidential"],
          scopesSupported: configJson.scopes_supported,
          codeChallengeMethodSupported: configJson.code_challenge_methods_supported,
          tokenEndpointAuthMethodSupported: configJson.token_endpoint_auth_methods_supported,
        }
      }))

      const configMap = new Map(configs.map(config => [config.name, config]));
      configMap.set(defaultConfig.name, defaultConfig)
      setPlatformConfigMap(configMap)
    })()
  }, [])

  return (
    <>
      <label htmlFor="provider_select">
        Provider
      </label>
      <select
        id="provider_select"
        onChange={(e) => {
          platformConfigMap.get(e.target.value) && setAuthConfig(platformConfigMap.get(e.target.value)!)
        }}
      >
        {Array.from(platformConfigMap.values()).map(config => {
          return <option value={config.name} key={config.name}>{config.name}</option>
        })}
      </select>
      <AuthForm
        config={authConfig}
        redirectUri={redirectUri}
        onSubmit={(params) => {
          setLog("");
          setResult("");

          chrome.runtime.sendMessage(
            {
              action: "submit",
              value: params,
            },
            () => {}
          );
        }}
      />
      <br />
      <br />
      <div>log</div>
      <textarea id="log" cols={60} rows={10} value={log} ref={logRef} />
      <div>result</div>
      <textarea id="result" cols={60} rows={4} value={result} />
    </>
  );
}

export default Panel