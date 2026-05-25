import { copyFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const assetsDir = join(process.cwd(), 'dist', 'assets')

const legacyJsAssets = [
  'index-B18HgI7y.js',
  'index-B5D_i6uL.js',
  'index-By1Uiu1M.js',
  'index-CsA2p_VK.js',
  'index-CTKYF3dL.js',
  'index-CENZ5zyK.js',
  'index-D_jZtO7Y.js',
  'index-DBHAHrMC.js',
  'index-DbQ6-nSj.js',
  'index-Df7_t8hI.js',
  'index-DhrBJgDH.js',
  'index-dFu32v3X.js',
  'index-DMwD37sb.js',
  'index-DQJBkGsS.js',
  'index-Dt5BAbO1.js',
  'index-DvTrzD4q.js',
  'index-BnZDk_lh.js',
  'index-EhtNlvcD.js',
]

const legacyCssAssets = [
  'index-B0xYHsO2.css',
  'index-B39r7jXP.css',
  'index-Bc9CFzYd.css',
  'index-BMrMzo00.css',
  'index-BPxFBi5w.css',
  'index-ClSJjIPy.css',
  'index-cpOy6jb8.css',
  'index-C13MMUVE.css',
  'index-CtyKK4WQ.css',
  'index-DaHgGISd.css',
  'index-DENP6QD4.css',
  'index-De_lM-Vk.css',
  'index-DLzv2Y-D.css',
  'index-FCtj_0Q8.css',
  'index-LgVj253R.css',
  'index-WgFq0DrH.css',
]

function getLargestAsset(extension) {
  if (!existsSync(assetsDir)) {
    throw new Error(`Build assets directory does not exist: ${assetsDir}`)
  }

  const assets = readdirSync(assetsDir)
    .filter((name) => name.startsWith('index-') && name.endsWith(extension))
    .map((name) => {
      const path = join(assetsDir, name)
      return { name, path, size: statSync(path).size }
    })
    .sort((left, right) => right.size - left.size)

  if (assets.length === 0) {
    throw new Error(`No ${extension} build asset found in ${assetsDir}`)
  }

  return assets[0].path
}

function copyCompatAssets(source, names) {
  for (const name of names) {
    const target = join(assetsDir, name)
    if (target !== source) {
      copyFileSync(source, target)
    }
  }
}

const currentJs = getLargestAsset('.js')
const currentCss = getLargestAsset('.css')

copyCompatAssets(currentJs, legacyJsAssets)
copyCompatAssets(currentCss, legacyCssAssets)

console.log(`EdgeOne compatibility assets written: ${legacyJsAssets.length} js, ${legacyCssAssets.length} css`)
