const jsonHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function getStore(env) {
  return env.EDITOR_ASSETS_KV
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

export async function onRequestPost({ request, env }) {
  const store = getStore(env)
  if (!store) {
    return Response.json({ error: 'KV binding EDITOR_ASSETS_KV is not configured.' }, { status: 500, headers: jsonHeaders })
  }

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
  await store.put(key, await file.arrayBuffer(), {
    metadata: {
      contentType: file.type || 'application/octet-stream',
    },
  })

  return Response.json({ key, url: assetUrlForKey(key) }, { headers: jsonHeaders })
}

export async function onRequestGet({ params, env }) {
  const store = getStore(env)
  if (!store) {
    return new Response('KV binding EDITOR_ASSETS_KV is not configured.', { status: 500 })
  }

  const key = pathParamToKey(params.path)
  if (!key) {
    return Response.json({ ok: true, usage: 'POST an image file or GET /api/editor-assets/uploads/<file>.' }, { headers: jsonHeaders })
  }

  const object = await store.getWithMetadata(key, 'arrayBuffer')
  if (!object.value) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(object.value, {
    headers: {
      'Content-Type': object.metadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
