import {
  onRequestGet as onRequestGetWithPath,
  onRequestOptions,
  onRequestPost,
} from './editor-assets/[[path]].js'

export { onRequestOptions, onRequestPost }

export async function onRequestGet(context) {
  return onRequestGetWithPath({
    ...context,
    params: { ...(context.params || {}), path: '' },
  })
}
