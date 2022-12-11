import * as React from 'react'
import { useRef, useState, useEffect } from 'react';
import AuthForm from './AuthForm';

type Props = {}

const Panel = (props: Props) => {
  const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`

  const defaultConfig: AuthFormConfig = {
    issuer: "CustomProvider",
    authorizationEndpoint: null,
    tokenEndpoint: null,
    clientTypesSupported: ["public", "confidential"],
    scopesSupported: null,
    codeChallengeMethodSupported: ["S256", "plain", "no"],
    tokenEndpointAuthMethodSupported: ["client_secret_basic", "client_secret_post"],
  }

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

  return (
    <>
      <AuthForm
        config={defaultConfig}
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