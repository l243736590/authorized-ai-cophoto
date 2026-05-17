const stateKey = 'state/editor-elements.json'

const jsonHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
}

function getStore(env) {
  return env.EDITOR_ASSETS_KV
}

function isEditorElementArray(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (element) =>
        element &&
        typeof element.id === 'string' &&
        (element.type === 'text' || element.type === 'image') &&
        typeof element.content === 'string' &&
        typeof element.x === 'number' &&
        typeof element.y === 'number' &&
        typeof element.width === 'number' &&
        typeof element.rotation === 'number' &&
        typeof element.fontSize === 'number' &&
        typeof element.zIndex === 'number',
    )
  )
}

export async function onRequestOptions() {
  return new Response(null, { headers: jsonHeaders })
}

export async function onRequestGet({ env }) {
  const store = getStore(env)
  if (!store) {
    return Response.json([], { headers: jsonHeaders })
  }

  const text = await store.get(stateKey)
  if (!text) {
    return Response.json([], { headers: jsonHeaders })
  }

  return new Response(text, { headers: jsonHeaders })
}

export async function onRequestPut({ request, env }) {
  const store = getStore(env)
  if (!store) {
    return Response.json({ error: 'KV binding EDITOR_ASSETS_KV is not configured.' }, { status: 500, headers: jsonHeaders })
  }

  const text = await request.text()
  if (text.length > 2_500_000) {
    return Response.json({ error: 'Editor state is too large.' }, { status: 413, headers: jsonHeaders })
  }

  let state
  try {
    state = JSON.parse(text)
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400, headers: jsonHeaders })
  }

  if (!isEditorElementArray(state)) {
    return Response.json({ error: 'Invalid editor state shape.' }, { status: 400, headers: jsonHeaders })
  }

  await store.put(stateKey, JSON.stringify(state))

  return Response.json({ ok: true }, { headers: jsonHeaders })
}
