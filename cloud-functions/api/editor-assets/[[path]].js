import { getStore } from '@edgeone/pages-blob'

const jsonHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function getEditorStore() {
  return getStore({ name: 'authorized-ai-cophoto-editor', consistency: 'strong' })
}

function extensionFromFile(file) {
  const contentType = file.type || ''
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('gif')) return 'gif'
  if (contentType.includes('svg')) return 'svg'
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg'
  return 'bin'
}

function contentTypeFromKey(key) {
  const extension = key.split('.').pop()?.toLowerCase()
  if (extension === 'png') return 'image/png'
  if (extension === 'webp') return 'image/webp'
  if (extension === 'gif') return 'image/gif'
  if (extension === 'svg') return 'image/svg+xml'
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
  return 'application/octet-stream'
}

function pathParamToKey(path) {
  if (Array.isArray(path)) {
    return path.join('/')
  }
  return path || ''
}

function assetUrlForKey(key) {
  return `/api/editor-assets/${key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`
}

export async function onRequestOptions() {
  return new Response(null, { headers: jsonHeaders })
}

export async function onRequestPost({ request }) {
  const formData = await request.formData()
  const file = formData.get('file')
  if (!file || typeof file.arrayBuffer !== 'function') {
    return Response.json({ error: 'Missing file upload.' }, { status: 400, headers: jsonHeaders })
  }

  const maxBytes = 3 * 1024 * 1024
  if (file.size > maxBytes) {
    return Response.json({ error: 'File is too large for the demo uploader.' }, { status: 413, headers: jsonHeaders })
  }

  const key = `uploads/${Date.now()}-${crypto.randomUUID()}.${extensionFromFile(file)}`
  const store = getEditorStore()
  await store.set(key, await file.arrayBuffer(), {
    cacheControl: 'public, max-age=31536000',
    contentType: file.type || 'application/octet-stream',
  })

  return Response.json({ key, url: assetUrlForKey(key) }, { headers: jsonHeaders })
}

export async function onRequestGet({ params }) {
  const key = pathParamToKey(params.path)
  if (!key) {
    return Response.json({ ok: true, usage: 'POST an image file or GET /api/editor-assets/uploads/<file>.' }, { headers: jsonHeaders })
  }

  const store = getEditorStore()
  const [body, metadata] = await Promise.all([
    store.get(key, { type: 'arrayBuffer', consistency: 'strong' }),
    store.getMetadata(key, { consistency: 'strong' }),
  ])
  if (!body) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(body, {
    headers: {
      'Content-Type': metadata?.contentType || contentTypeFromKey(key),
      'Cache-Control': metadata?.cacheControl || 'public, max-age=31536000',
    },
  })
}
