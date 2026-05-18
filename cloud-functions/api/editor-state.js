import { getStore } from '@edgeone/pages-blob'

const stateKey = 'state/editor-elements.json'

const jsonHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
}

function getEditorStore() {
  return getStore({ name: 'authorized-ai-cophoto-editor', consistency: 'strong' })
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

export async function onRequestGet() {
  const store = getEditorStore()
  const state = await store.get(stateKey, { type: 'json', consistency: 'strong' })

  return Response.json(isEditorElementArray(state) ? state : [], { headers: jsonHeaders })
}

export async function onRequestPut({ request }) {
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

  const store = getEditorStore()
  await store.setJSON(stateKey, state)

  return Response.json({ ok: true }, { headers: jsonHeaders })
}
