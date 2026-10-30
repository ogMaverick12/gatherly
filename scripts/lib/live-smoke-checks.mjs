import {
  BASE,
  DEFAULT_MODELS,
  IDEAS_CONTEXT,
  PLAN_SUMMARY,
  SNAPSHOT,
} from './live-smoke-config.mjs';
import {
  callRoute,
  chatFrames,
  fieldsAreTyped,
  modelIsMissing,
  say,
  startServer,
} from './live-smoke-api.mjs';

/** True when an idea has the fields the schema promises. */
function ideaShapeIsRight(idea) {
  return (
    typeof idea === 'object' &&
    idea !== null &&
    typeof idea.title === 'string' &&
    idea.title.length > 0 &&
    typeof idea.body === 'string' &&
    idea.body.length > 0 &&
    typeof idea.rationale === 'string' &&
    Array.isArray(idea.tags)
  );
}

/** The three skipped checks when a provider has no key. */
function skippedChecks() {
  return ['/api/parse', '/api/ideas', '/api/chat'].map((route) => ({
    route,
    result: 'skipped',
    detail: 'no key in the environment',
  }));
}

/** The three failure checks when the local server does not start. */
function serverFailedChecks() {
  return ['/api/parse', '/api/ideas', '/api/chat'].map((route) => ({
    route,
    result: 'fail',
    detail: 'the server did not start',
  }));
}

/** Report a missing model and return its failed check. */
function modelMissingCheck(provider, route, model) {
  say(`MODEL NOT FOUND: ${model} - set ${provider.modelName}`);
  return { route, result: 'fail', detail: `model not found: ${model}` };
}

/** Parse: free text into plan fields. */
async function checkParse(provider, model, key) {
  const parse = await callRoute('/api/parse', {
    text: 'A wedding on 5 December for 120 guests in Pune, about 8 lakh rupees.',
  });
  if (modelIsMissing(parse.status, parse.parsed)) {
    return { check: modelMissingCheck(provider, '/api/parse', model), stop: true };
  }
  const parseOk =
    parse.status === 200 &&
    parse.parsed?.mode === 'provider' &&
    parse.parsed?.provider === provider.id &&
    parse.parsed?.fields &&
    fieldsAreTyped(parse.parsed.fields) &&
    !parse.text.includes(key);
  return {
    check: {
      route: '/api/parse',
      result: parseOk ? 'pass' : 'fail',
      detail: parseOk
        ? `mode=${parse.parsed.mode}, provider=${parse.parsed.provider}`
        : `status=${parse.status}, mode=${parse.parsed?.mode}, provider=${parse.parsed?.provider}`,
    },
    stop: false,
  };
}

/** Ideas: a list of ideas with the promised shape. */
async function checkIdeas(provider, model, key) {
  const ideas = await callRoute('/api/ideas', {
    planSummary: PLAN_SUMMARY,
    context: IDEAS_CONTEXT,
  });
  if (modelIsMissing(ideas.status, ideas.parsed)) {
    return { check: modelMissingCheck(provider, '/api/ideas', model), stop: true };
  }
  const ideasOk =
    ideas.status === 200 &&
    ideas.parsed?.mode === 'provider' &&
    ideas.parsed?.provider === provider.id &&
    Array.isArray(ideas.parsed?.ideas) &&
    ideas.parsed.ideas.length > 0 &&
    ideas.parsed.ideas.every(ideaShapeIsRight) &&
    !ideas.text.includes(key);
  return {
    check: {
      route: '/api/ideas',
      result: ideasOk ? 'pass' : 'fail',
      detail: ideasOk
        ? `mode=${ideas.parsed.mode}, ${ideas.parsed.ideas.length} ideas`
        : `status=${ideas.status}, mode=${ideas.parsed?.mode}, provider=${ideas.parsed?.provider}`,
    },
    stop: false,
  };
}

/** Chat: the stream says which provider answered, then the answer. */
async function checkChat(provider, model, key) {
  const chat = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What should we do next?',
      planSummary: PLAN_SUMMARY,
      snapshot: SNAPSHOT,
    }),
  });
  const chatText = await chat.text();
  const { frames, modeFrame, doneFrame, deltaFrames, answerText } = chatFrames(chatText);
  if (modelIsMissing(chat.status, doneFrame?.data)) {
    return { check: modelMissingCheck(provider, '/api/chat', model), stop: true };
  }
  const chatOk =
    chat.status === 200 &&
    modeFrame?.data?.provider === provider.id &&
    modeFrame?.data?.live === true &&
    deltaFrames.length > 1 &&
    answerText.length > 0 &&
    doneFrame?.data?.mode === 'provider' &&
    !chatText.includes(key);
  return {
    check: {
      route: '/api/chat',
      result: chatOk ? 'pass' : 'fail',
      detail: chatOk
        ? `provider=${modeFrame.data.provider}, ${deltaFrames.length} deltas, ${frames.length} frames`
        : `status=${chat.status}, provider=${modeFrame?.data?.provider}, live=${modeFrame?.data?.live}, deltas=${deltaFrames.length}, mode=${doneFrame?.data?.mode}`,
    },
    stop: false,
  };
}

/**
 * Probe one provider end to end and return its ordered checks.
 *
 * @param provider the provider entry from the shared config
 */
export async function checkProvider(provider) {
  const key = process.env[provider.keyName];
  const model = process.env[provider.modelName] ?? DEFAULT_MODELS[provider.id];
  if (!key) return skippedChecks();

  const server = await startServer({
    GATHERLY_AI_PROVIDER: provider.id,
    [provider.keyName]: key,
  });

  try {
    if (!server.ready) return serverFailedChecks();
    const checks = [];
    for (const probe of [checkParse, checkIdeas, checkChat]) {
      const { check, stop } = await probe(provider, model, key);
      checks.push(check);
      if (stop) return checks;
    }
    return checks;
  } finally {
    server.child.kill();
  }
}
