export type AiAvailability = Availability | 'not-supported';

export async function checkAvailability(): Promise<AiAvailability> {
  if (typeof LanguageModel === 'undefined') {
    return 'not-supported';
  }
  return LanguageModel.availability({
    expectedInputs: [{ type: 'text' }],
    expectedOutputs: [{ type: 'text' }],
  });
}

export async function suggest(
  snapshot: PageFormSnapshot,
  onDownloadProgress: (loaded: number, total: number) => void,
  onStatus: (status: string) => void,
): Promise<AiSuggestions> {
  if (typeof LanguageModel === 'undefined') {
    return { warnings: ['AI feature is not available'] };
  }

  console.log('[ai-suggest] snapshot:', snapshot);

  const prompt = buildPrompt(snapshot);
  console.log('[ai-suggest] prompt:', prompt);

  const availability = await LanguageModel.availability();
  const needsDownload = availability !== 'available';

  onStatus('preparing');
  const session = await LanguageModel.create({
    monitor: needsDownload
      ? (m) => { m.addEventListener('downloadprogress', (e) => onDownloadProgress(e.loaded, e.total)); }
      : undefined,
  });

  try {
    onStatus('thinking');
    const raw = await session.prompt(prompt);
    console.log('[ai-suggest] raw response:', raw);
    const result = parseResponse(raw);
    console.log('[ai-suggest] parsed result:', result);
    return result;
  } finally {
    session.destroy();
  }
}

function buildPrompt(snapshot: PageFormSnapshot): string {
  let formFieldsSection = '';
  if (snapshot.formFields && snapshot.formFields.length > 0) {
    const fieldLines = snapshot.formFields.map(f =>
      `  - selector: "${f.selector}", type: "${f.type}", name: "${f.name}", id: "${f.id}", placeholder: "${f.placeholder}", label: "${f.label}"`
    ).join('\n');
    formFieldsSection = `\n\nForm fields found on the page:\n${fieldLines}`;
  }

  return `You are analyzing a web page related to an OAuth provider (settings page or API documentation).
The user is trying to configure an OAuth client in a Chrome extension.

Page URL: ${snapshot.url}
Page Title: ${snapshot.title}

Page content:
${snapshot.content}${formFieldsSection}

Based on the page content, identify any OAuth-related values. Respond ONLY with a JSON object:
{
  "authorizationEndpoint": "authorization endpoint URL if found",
  "tokenEndpoint": "token endpoint URL if found",
  "clientId": "client ID value if found",
  "clientSecret": "client secret value if found",
  "scope": "space-separated scopes if found",
  "redirectUriFieldSelector": "CSS selector of the form field where the user should enter their redirect URI / callback URL, if such a field exists on the page"
}

Rules:
- Only include keys where the value is explicitly and clearly shown on the page (e.g. labeled as "Client ID", "Client Secret", etc.).
- Do NOT guess or infer values from ambiguous content. If the page is not an OAuth settings or API documentation page, return an empty JSON object {}.
- Omit any key you are not highly confident about.`;
}

function parseResponse(raw: string): AiSuggestions {
  const warnings: string[] = [];
  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return { warnings: ['Failed to parse JSON from AI response'] };
    }
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return { warnings: ['Failed to parse JSON from AI response'] };
    }
  }

  const result: AiSuggestions = { warnings };

  if (typeof parsed.clientId === 'string' && parsed.clientId) {
    result.clientId = { value: parsed.clientId, fieldLabel: '' };
  }

  if (typeof parsed.clientSecret === 'string' && parsed.clientSecret) {
    result.clientSecret = { value: parsed.clientSecret, fieldLabel: '' };
  }

  if (typeof parsed.scope === 'string' && parsed.scope) {
    result.scope = { value: parsed.scope, fieldLabel: '' };
  }

  if (typeof parsed.authorizationEndpoint === 'string' && isUrl(parsed.authorizationEndpoint)) {
    result.authorizationEndpoint = { value: parsed.authorizationEndpoint, fieldLabel: '' };
  }

  if (typeof parsed.tokenEndpoint === 'string' && isUrl(parsed.tokenEndpoint)) {
    result.tokenEndpoint = { value: parsed.tokenEndpoint, fieldLabel: '' };
  }

  if (typeof parsed.redirectUriFieldSelector === 'string' && parsed.redirectUriFieldSelector) {
    result.redirectUriFieldSelector = parsed.redirectUriFieldSelector;
  }

  return result;
}

function isUrl(s: string): boolean {
  try {
    const url = new URL(s);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
