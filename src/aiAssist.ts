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

export async function prepareSession(
  onDownloadProgress: (loaded: number, total: number) => void,
) {
  if (typeof LanguageModel === 'undefined') {
    throw new Error('AI feature is not available');
  }

  const availability = await LanguageModel.availability();
  const needsDownload = availability !== 'available';

  return LanguageModel.create({
    monitor: needsDownload
      ? (m) => { m.addEventListener('downloadprogress', (e) => onDownloadProgress(e.loaded, e.total)); }
      : undefined,
  });
}

const responseConstraint = {
  type: 'object',
  properties: {
    authorizationEndpoint: { type: 'string' },
    tokenEndpoint: { type: 'string' },
    clientId: { type: 'string' },
    clientSecret: { type: 'string' },
    scope: { type: 'string' },
    redirectUriField: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        label: { type: 'string' },
        name: { type: 'string' },
        id: { type: 'string' },
      },
      required: ['selector'],
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

export async function analyze(
  session: Awaited<ReturnType<typeof LanguageModel.create>>,
  snapshot: PageFormSnapshot,
): Promise<AiSuggestions> {
  console.log('[ai-analyze] snapshot:', snapshot);

  const prompt = buildPrompt(snapshot);
  console.log('[ai-analyze] prompt:', prompt);

  try {
    const raw = await session.prompt(prompt, { responseConstraint });
    console.log('[ai-analyze] raw response:', raw);
    const result = parseResponse(raw);
    console.log('[ai-analyze] parsed result:', result);
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

Based on the page content, identify any OAuth-related values:
- authorizationEndpoint: authorization endpoint URL if found
- tokenEndpoint: token endpoint URL if found
- clientId: client ID value if found
- clientSecret: client secret value if found
- scope: space-separated scopes if found
- redirectUriField: if a form field exists on the page where the user should enter their redirect URI / callback URL, return an object with: selector (CSS selector), label (associated label text), name (name attribute), id (id attribute)

Rules:
- Only include keys where the value is explicitly and clearly shown on the page (e.g. labeled as "Client ID", "Client Secret", etc.).
- Do NOT guess or infer values from ambiguous content. If the page is not an OAuth settings or API documentation page, return an empty object.
- Omit any key you are not highly confident about.`;
}

function parseResponse(raw: string): AiSuggestions {
  const warnings: string[] = [];
  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { warnings: ['Failed to parse JSON from AI response'] };
  }

  const result: AiSuggestions = { warnings };

  if (typeof parsed.clientId === 'string' && parsed.clientId) {
    result.clientId = parsed.clientId;
  }

  if (typeof parsed.clientSecret === 'string' && parsed.clientSecret) {
    result.clientSecret = parsed.clientSecret;
  }

  if (typeof parsed.scope === 'string' && parsed.scope) {
    result.scope = parsed.scope;
  }

  if (typeof parsed.authorizationEndpoint === 'string' && isUrl(parsed.authorizationEndpoint)) {
    result.authorizationEndpoint = parsed.authorizationEndpoint;
  }

  if (typeof parsed.tokenEndpoint === 'string' && isUrl(parsed.tokenEndpoint)) {
    result.tokenEndpoint = parsed.tokenEndpoint;
  }

  if (parsed.redirectUriField && typeof parsed.redirectUriField === 'object') {
    const field = parsed.redirectUriField as Record<string, unknown>;
    if (typeof field.selector === 'string' && field.selector) {
      result.redirectUriField = {
        selector: field.selector,
        label: typeof field.label === 'string' ? field.label : '',
        name: typeof field.name === 'string' ? field.name : '',
        id: typeof field.id === 'string' ? field.id : '',
      };
    }
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
