import * as React from 'react'
import { useRef, useState, useEffect, useCallback } from 'react';
import AuthForm from './AuthForm';
import AiAssistDialog from './AiAssistDialog';
import { collectPageSnapshot } from '../pageSnapshot';

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
  const [copyButtonText, setCopyButtonText] = useState("copy access token");
  const [accessToken, setAccessToken] = useState("")
  const accessTokenInputRef = useRef<HTMLInputElement>(null);

  const [log, setLog] = useState<string>("")
  const [result, setResult] = useState<string>("")
  const logRef = useRef<HTMLTextAreaElement>(null)

  const [fieldValues, setFieldValues] = useState<SuggestableFieldValues>({
    authorizationEndpoint: "",
    tokenEndpoint: "",
    clientId: "",
    clientSecret: "",
    scope: "",
  });
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());

  const [aiAvailable, setAiAvailable] = useState<boolean>(false)
  const [aiLoading, setAiLoading] = useState<boolean>(false)
  const [aiStep, setAiStep] = useState<string>("")
  const [showAiDialog, setShowAiDialog] = useState<boolean>(false)
  const [aiDownloading, setAiDownloading] = useState<boolean>(false)
  const [aiDownloadProgress, setAiDownloadProgress] = useState<number>(0)
  const [suggestions, setSuggestions] = useState<AiSuggestions | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  const handleModelReadyRef = useRef<() => void>(() => {});

  useEffect(() => {
    const listener = (raw: any) => {
      const message = raw as ExtensionMessage;
      console.log(message);

      switch (message.action) {
        case "log":
          setLog((prev) => prev + message.value + "\n");
          logRef.current?.scrollTo(0, logRef.current.scrollHeight);
          break;
        case "ai-status":
          setAiStep(message.value);
          break;
        case "ai-download-progress":
          setAiDownloading(true);
          setAiDownloadProgress(message.value);
          break;
        case "ai-result":
          setAiLoading(false);
          setAiDownloading(false);
          setAiStep("complete");
          setSuggestions(message.value);
          setAppliedFields(new Set());
          if (message.value.warnings?.length > 0) {
            setAiError(message.value.warnings.join(', '));
          }
          break;
        case "ai-model-ready":
          handleModelReadyRef.current();
          break;
        case "ai-error":
          setAiLoading(false);
          setAiDownloading(false);
          setShowAiDialog(false);
          setAiStep("");
          setAiError(message.value);
          break;
        case "result":
          setResult(message.value);
          try {
            const parsed = JSON.parse(message.value);
            if (parsed["access_token"]) {
              setAccessToken(parsed["access_token"]);
            }
          } catch (e) {
            setLog((prev) => prev + e + "\n");
            console.error(e);
          }
          break;
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    }
  }, []);

  useEffect(() => {
    (window as any).__simulateAiDownload = () => {
      setShowAiDialog(true);
      setAiLoading(true);
      setAiStep("preparing");
      setAiDownloading(true);
      setAiDownloadProgress(0);
      let p = 0;
      const id = setInterval(() => {
        p += 10;
        setAiDownloadProgress(p);
        if (p >= 100) {
          clearInterval(id);
          setAiDownloading(false);
          setAiStep("extracting");
          setTimeout(() => {
            setAiStep("thinking");
            setTimeout(() => {
              setAiLoading(false);
              setAiStep("complete");
              setSuggestions({
                clientId: "dummy-client-id",
                scope: "openid profile",
                warnings: [],
              });
              setAppliedFields(new Set());
            }, 1500);
          }, 1500);
        }
      }, 500);
    };
  }, []);

  useEffect(() => {
    const msg: ExtensionMessage = { action: "ai-check-availability" };
    chrome.runtime.sendMessage(msg, (response) => {
      if (response?.availability === 'available' || response?.availability === 'downloadable' || response?.availability === 'downloading') {
        setAiAvailable(true);
      }
    });
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
          tokenEndpoint: configJson.token_endpoint || defaultConfig.tokenEndpoint,
          clientTypesSupported: configJson.client_types_supported || defaultConfig.clientTypesSupported,
          scopesSupported: configJson.scopes_supported || defaultConfig.scopesSupported,
          codeChallengeMethodSupported: configJson.code_challenge_methods_supported || defaultConfig.codeChallengeMethodSupported,
          tokenEndpointAuthMethodSupported: configJson.token_endpoint_auth_methods_supported || defaultConfig.tokenEndpointAuthMethodSupported,
        }
      }))

      const configMap = new Map(configs.map(config => [config.name, config]));
      configMap.set(defaultConfig.name, defaultConfig)
      setPlatformConfigMap(configMap)
    })()
  }, [])

  useEffect(() => {
    setTimeout(() => {
      setCopyButtonText("copy access token");
    }, 1000);
  }, [copyButtonText]);

  const getTargetTabId = useCallback(async (): Promise<number> => {
    if (typeof chrome.devtools !== 'undefined') {
      return chrome.devtools.inspectedWindow.tabId;
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab.id!;
  }, []);

  const handleReadFromPage = useCallback(() => {
    setAiLoading(true);
    setAiError(null);
    setSuggestions(null);
    setAiStep("preparing");
    setShowAiDialog(true);
    const msg: ExtensionMessage = { action: "ai-prepare" };
    chrome.runtime.sendMessage(msg, () => void chrome.runtime.lastError);
  }, []);

  const handleModelReady = useCallback(async () => {
    setAiStep("extracting");
    try {
      const tabId = await getTargetTabId();
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: collectPageSnapshot,
      });
      const snapshot = results[0]?.result as PageFormSnapshot | undefined;
      if (!snapshot) {
        setAiError('Failed to read page content');
        setAiLoading(false);
        setShowAiDialog(false);
        return;
      }
      setAiStep("thinking");
      const msg: ExtensionMessage = { action: "ai-analyze", value: snapshot };
      chrome.runtime.sendMessage(msg, () => void chrome.runtime.lastError);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : String(e));
      setAiLoading(false);
      setShowAiDialog(false);
    }
  }, [getTargetTabId]);

  useEffect(() => { handleModelReadyRef.current = handleModelReady; }, [handleModelReady]);

  const handleInjectRedirectUri = useCallback(async (selector: string) => {
    try {
      const tabId = await getTargetTabId();
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (sel: string, value: string) => {
          var el = document.querySelector(sel) as HTMLInputElement | null;
          if (!el) return;
          el.value = value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        },
        args: [selector, redirectUri],
      });
    } catch (e) {
      setLog(prev => prev + `[error] failed to inject redirect_uri: ${e}\n`);
    }
  }, [getTargetTabId, redirectUri]);

  const handleFieldChange = useCallback((field: keyof SuggestableFieldValues, value: string) => {
    setFieldValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAppliedFieldAdd = useCallback((field: string) => {
    setAppliedFields(s => new Set(s).add(field));
  }, []);

  const handleApplyAll = useCallback(() => {
    if (!suggestions) return;
    const newValues = { ...fieldValues };
    const applied = new Set(appliedFields);
    if (suggestions.authorizationEndpoint && authConfig.authorizationEndpoint === null) {
      newValues.authorizationEndpoint = suggestions.authorizationEndpoint;
      applied.add('authorizationEndpoint');
    }
    if (suggestions.tokenEndpoint && authConfig.tokenEndpoint === null) {
      newValues.tokenEndpoint = suggestions.tokenEndpoint;
      applied.add('tokenEndpoint');
    }
    if (suggestions.clientId) { newValues.clientId = suggestions.clientId; applied.add('clientId'); }
    if (suggestions.clientSecret) { newValues.clientSecret = suggestions.clientSecret; applied.add('clientSecret'); }
    if (suggestions.scope) { newValues.scope = suggestions.scope; applied.add('scope'); }
    if (suggestions.redirectUriField) {
      handleInjectRedirectUri(suggestions.redirectUriField.selector);
      applied.add('redirectUriField');
    }
    setFieldValues(newValues);
    setAppliedFields(applied);
    setShowAiDialog(false);
    setAiStep("");
  }, [suggestions, fieldValues, appliedFields, authConfig, handleInjectRedirectUri]);

  const handleCloseDialog = useCallback(() => {
    setShowAiDialog(false);
    setAiStep("");
  }, []);

  return (
    <>
      <label htmlFor="provider_select">Provider</label>
      <select
        id="provider_select"
        onChange={(e) => {
          platformConfigMap.get(e.target.value) &&
            setAuthConfig(platformConfigMap.get(e.target.value)!);
        }}
        style={{ marginLeft: "8px" }}
      >
        {Array.from(platformConfigMap.values()).map((config) => {
          return (
            <option value={config.name} key={config.name}>
              {config.name}
            </option>
          );
        })}
      </select>
      {aiAvailable && (
        <button
          type="button"
          id="ai_suggest_button"
          onClick={handleReadFromPage}
          disabled={aiLoading}
          title="Extract IDs with AI"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
          </svg>
        </button>
      )}
      {showAiDialog && aiStep && (
        <AiAssistDialog
          currentStep={aiStep}
          downloading={aiDownloading}
          downloadProgress={aiDownloadProgress}
          suggestions={suggestions}
          onApplyAll={handleApplyAll}
          onClose={handleCloseDialog}
          onCancel={() => {
            setAiLoading(false);
            setAiDownloading(false);
            setShowAiDialog(false);
            setAiStep("");
          }}
        />
      )}
      {aiError && !aiLoading && (
        <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
          {aiError}
        </div>
      )}
      <AuthForm
        config={authConfig}
        redirectUri={redirectUri}
        suggestions={suggestions}
        fieldValues={fieldValues}
        appliedFields={appliedFields}
        onFieldChange={handleFieldChange}
        onAppliedFieldAdd={handleAppliedFieldAdd}
        onInjectRedirectUri={handleInjectRedirectUri}
        onSubmit={(params) => {
          setLog("");
          setResult("");
          setAccessToken("");

          const msg: ExtensionMessage = { action: "submit", value: params };
          chrome.runtime.sendMessage(msg, () => {});
        }}
      />
      <br />
      <div>log</div>
      <textarea id="log" cols={80} rows={10} value={log} ref={logRef} readOnly />
      <div>result</div>
      <textarea id="result" cols={80} rows={4} value={result} readOnly />
      <br />
      <button
        id="copy_access_token_button"
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(accessToken);
            setCopyButtonText("copied!");
          } catch (e) {
            setLog((prev) => prev + `[error] failed to copy: ${e}\n`);
          }
        }}
        disabled={accessToken === ""}
      >
        {copyButtonText}
      </button>
      {accessToken !== "" && (
        <p
          style={{ color: "gray" }}
        >
          Thank you for using extension 🎉. As this is donationware, please
          consider
          {' '}<a href="https://www.buymeacoffee.com/satetsu888" target="_blank">donation</a>{' '}
          or
          {' '}<a href="https://chrome.google.com/webstore/detail/simple-oauth2-client/bmcbmjlmbpndabffoeejkfaknnknioej" target="_blank">post your review</a>{' '}
          if this helps your work!
        </p>
      )}
    </>
  );
}

export default Panel
