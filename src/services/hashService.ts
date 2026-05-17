export function createMockHash(input: string, prefix = '0xmock'): string {
  let hash = 2166136261

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  const base = (hash >>> 0).toString(16).padStart(8, '0')
  return `${prefix}${base}${base.split('').reverse().join('')}${base}`
}

export function createImageHash(seed: string): string {
  return createMockHash(`image:${seed}`)
}

export function createLicenseHash(seed: string): string {
  return createMockHash(`license:${seed}`)
}

export function createCertificateHash(seed: string): string {
  return createMockHash(`certificate:${seed}`)
}
