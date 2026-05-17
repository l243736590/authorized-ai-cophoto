import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
import { useAdmin } from '../context/AdminContext'
import { useLanguage } from '../i18n/LanguageContext'
import { DomElementEditor } from './DomElementEditor'
import { EditorCanvasLayer } from './EditorCanvasLayer'
import { EditableStickerLayer } from './EditableStickerLayer'

interface LayoutProps {
  children: ReactNode
  compact?: boolean
}

type BrandItemId = 'logo' | 'tagline'

interface BrandItemState {
  x: number
  y: number
  width: number
  rotation: number
  zIndex: number
  fontSize?: number
  deleted: boolean
}

type BrandState = Record<BrandItemId, BrandItemState>
type BrandDragMode = 'move' | 'resize' | 'rotate'

interface BrandDragState {
  id: BrandItemId
  mode: BrandDragMode
  startX: number
  startY: number
  startItem: BrandItemState
  centerX?: number
  centerY?: number
  startAngle?: number
}

const brandStorageKey = 'authorized-ai-cophoto-brand-v3'
const defaultBrandState: BrandState = {
  logo: {
    x: -18,
    y: -3,
    width: 365,
    rotation: 0,
    zIndex: 6,
    deleted: false,
  },
  tagline: {
    x: 14,
    y: 58,
    width: 300,
    rotation: 0,
    zIndex: 7,
    fontSize: 14,
    deleted: false,
  },
}

function getTextLogoPath(language: 'zh' | 'ko', isDay: boolean) {
  const tone = isDay ? 'dark' : 'light'
  return `/brand/${language}-text-${tone}.png`
}

function getFallbackTextLogoPath(language: 'zh' | 'ko', isDay: boolean) {
  const fallbackTone = isDay ? 'light' : 'dark'
  return `/brand/${language}-text-${fallbackTone}.png`
}

function handleLogoFallback(event: SyntheticEvent<HTMLImageElement>, fallbackSrc: string) {
  const image = event.currentTarget
  if (image.dataset.fallbackApplied === 'true') {
    image.style.display = 'none'
    return
  }

  image.dataset.fallbackApplied = 'true'
  image.src = fallbackSrc
}

function loadBrandState(): BrandState {
  try {
    const saved = window.localStorage.getItem(brandStorageKey)
    return saved ? { ...defaultBrandState, ...JSON.parse(saved) } : defaultBrandState
  } catch {
    return defaultBrandState
  }
}

function saveBrandState(brand: BrandState) {
  window.localStorage.setItem(brandStorageKey, JSON.stringify(brand))
}

function getPointerAngle(clientX: number, clientY: number, centerX: number, centerY: number) {
  return (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI
}

export function Layout({ children, compact = false }: LayoutProps) {
  const admin = useAdmin()
  const { language, setLanguage, isKo, theme, setTheme, isDay } = useLanguage()
  const [brand, setBrand] = useState<BrandState>(() => loadBrandState())
  const [activeBrandId, setActiveBrandId] = useState<BrandItemId | null>(null)
  const [brandDrag, setBrandDrag] = useState<BrandDragState | null>(null)
  const [, setLogoTapCount] = useState(0)
  const itemRefs = useRef<Record<BrandItemId, HTMLDivElement | null>>({ logo: null, tagline: null })
  const textLogoSrc = getTextLogoPath(language, isDay)
  const nav = isKo
    ? {
        create: '제작',
        admin: '권한자 콘솔',
        verify: '검증 예시',
        aria: '주요 탐색',
        day: '낮',
        night: '밤',
        logoAlt: '공식투샷 Licensed Frame',
        tagline: 'AI로 스타와 만드는 공식 인증 투샷',
      }
    : {
        create: '创建',
        admin: '授权后台',
        verify: '验证示例',
        aria: '主要导航',
        day: '白天',
        night: '夜间',
        logoAlt: '授权同框 Licensed Frame',
        tagline: '用 AI 生成与明星的授权合照',
      }
  const activeItem = useMemo(() => (activeBrandId ? brand[activeBrandId] : null), [activeBrandId, brand])

  useEffect(() => {
    saveBrandState(brand)
  }, [brand])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        saveBrandState(brand)
        setActiveBrandId(null)
        setBrandDrag(null)
      }

      if (admin.editMode && (event.key === 'Delete' || event.key === 'Backspace') && activeBrandId) {
        setBrand((current) => ({
          ...current,
          [activeBrandId]: { ...current[activeBrandId], deleted: true },
        }))
        setActiveBrandId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeBrandId, admin.editMode, brand])

  useEffect(() => {
    if (!brandDrag) {
      return
    }

    const currentDrag = brandDrag

    function handlePointerMove(event: PointerEvent) {
      const deltaX = event.clientX - currentDrag.startX
      const deltaY = event.clientY - currentDrag.startY

      setBrand((current) => {
        const currentItem = current[currentDrag.id]

        if (currentDrag.mode === 'move') {
          return {
            ...current,
            [currentDrag.id]: {
              ...currentItem,
              x: currentDrag.startItem.x + deltaX,
              y: currentDrag.startItem.y + deltaY,
            },
          }
        }

        if (currentDrag.mode === 'resize') {
          return {
            ...current,
            [currentDrag.id]: {
              ...currentItem,
              width: Math.max(currentDrag.id === 'logo' ? 180 : 120, currentDrag.startItem.width + deltaX),
            },
          }
        }

        if (
          currentDrag.mode === 'rotate' &&
          currentDrag.centerX !== undefined &&
          currentDrag.centerY !== undefined &&
          currentDrag.startAngle !== undefined
        ) {
          const currentAngle = getPointerAngle(event.clientX, event.clientY, currentDrag.centerX, currentDrag.centerY)
          return {
            ...current,
            [currentDrag.id]: {
              ...currentItem,
              rotation: currentDrag.startItem.rotation + currentAngle - currentDrag.startAngle,
            },
          }
        }

        return current
      })
    }

    function handlePointerUp() {
      setBrandDrag(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp, { once: true })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [brandDrag])

  function startBrandDrag(event: ReactPointerEvent, id: BrandItemId, mode: BrandDragMode) {
    if (!admin.editMode) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    setActiveBrandId(id)

    const rect = itemRefs.current[id]?.getBoundingClientRect()
    const centerX = rect ? rect.left + rect.width / 2 : event.clientX
    const centerY = rect ? rect.top + rect.height / 2 : event.clientY

    setBrandDrag({
      id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startItem: brand[id],
      centerX,
      centerY,
      startAngle: mode === 'rotate' ? getPointerAngle(event.clientX, event.clientY, centerX, centerY) : undefined,
    })
  }

  function deleteBrandItem(event: ReactMouseEvent, id: BrandItemId) {
    if (!admin.editMode) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    setBrand((current) => ({ ...current, [id]: { ...current[id], deleted: true } }))
    setActiveBrandId(null)
  }

  function resetBrandItem(event: ReactMouseEvent, id: BrandItemId) {
    if (!admin.editMode) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    setBrand((current) => ({ ...current, [id]: defaultBrandState[id] }))
    setActiveBrandId(null)
  }

  function restoreBrandItem(id: BrandItemId) {
    if (!admin.editMode) {
      return
    }

    setBrand((current) => ({ ...current, [id]: defaultBrandState[id] }))
    setActiveBrandId(null)
  }

  function adjustBrandLayer(id: BrandItemId, delta: number) {
    setBrand((current) => ({ ...current, [id]: { ...current[id], zIndex: Math.max(1, current[id].zIndex + delta) } }))
  }

  function handleLogoGatewayClick() {
    if (admin.editMode) {
      return
    }

    setLogoTapCount((current) => {
      const next = current + 1
      if (next >= 9) {
        window.location.href = '/admin/login'
        return 0
      }
      return next
    })
  }

  return (
    <div className={`${compact ? 'app-shell app-shell--compact' : 'app-shell'} app-shell--${language} app-shell--${theme}`}>
      <EditableStickerLayer />
      <EditorCanvasLayer />
      <DomElementEditor />
      <header className="topbar">
        <div className="brand-stage" aria-label={nav.logoAlt}>
          {brand.logo.deleted ? (
            <button className="brand-restore brand-restore--logo" type="button" onClick={() => restoreBrandItem('logo')}>
              恢复 LOGO
            </button>
          ) : (
            <div
              ref={(element) => {
                itemRefs.current.logo = element
              }}
              className={activeBrandId === 'logo' && admin.editMode ? 'brand-edit-item brand-edit-item--logo is-active' : 'brand-edit-item brand-edit-item--logo'}
              style={{
                left: brand.logo.x,
                top: brand.logo.y,
                width: brand.logo.width,
                zIndex: brand.logo.zIndex,
                transform: `rotate(${brand.logo.rotation}deg)`,
              }}
              onDoubleClick={(event) => {
                if (admin.editMode) {
                  event.preventDefault()
                  setActiveBrandId('logo')
                }
              }}
              onClick={handleLogoGatewayClick}
              onPointerDown={(event) => {
                if (activeBrandId === 'logo' && admin.editMode) {
                  startBrandDrag(event, 'logo', 'move')
                }
              }}
            >
              <img
                className="brand-logo brand-logo--text"
                src={textLogoSrc}
                alt={nav.logoAlt}
                onError={(event) => handleLogoFallback(event, getFallbackTextLogoPath(language, isDay))}
                onLoad={(event) => {
                  event.currentTarget.style.display = 'block'
                }}
              />
              {activeBrandId === 'logo' && admin.editMode && (
                <>
                  <div className="editor-mini-toolbar editor-mini-toolbar--brand">
                    <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => adjustBrandLayer('logo', 1)}>
                      图层上
                    </button>
                    <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => adjustBrandLayer('logo', -1)}>
                      图层下
                    </button>
                  </div>
                  <button
                    className="sticker-control sticker-control--delete brand-control"
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => deleteBrandItem(event, 'logo')}
                  >
                    删除
                  </button>
                  <button
                    className="sticker-control sticker-control--reset brand-control"
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => resetBrandItem(event, 'logo')}
                  >
                    重置
                  </button>
                  <span className="sticker-handle sticker-handle--resize" onPointerDown={(event) => startBrandDrag(event, 'logo', 'resize')} />
                  <span className="sticker-handle sticker-handle--rotate" onPointerDown={(event) => startBrandDrag(event, 'logo', 'rotate')} />
                </>
              )}
            </div>
          )}

          {brand.tagline.deleted ? (
            <button className="brand-restore brand-restore--tagline" type="button" onClick={() => restoreBrandItem('tagline')}>
              恢复说明
            </button>
          ) : (
            <div
              ref={(element) => {
                itemRefs.current.tagline = element
              }}
              className={
                activeBrandId === 'tagline' && admin.editMode
                  ? 'brand-edit-item brand-edit-item--tagline is-active'
                  : 'brand-edit-item brand-edit-item--tagline'
              }
              style={{
                left: brand.tagline.x,
                top: brand.tagline.y,
                width: brand.tagline.width,
                zIndex: brand.tagline.zIndex,
                fontSize: brand.tagline.fontSize,
                transform: `rotate(${brand.tagline.rotation}deg)`,
              }}
              onDoubleClick={(event) => {
                if (admin.editMode) {
                  event.preventDefault()
                  setActiveBrandId('tagline')
                }
              }}
              onPointerDown={(event) => {
                if (activeBrandId === 'tagline' && admin.editMode) {
                  startBrandDrag(event, 'tagline', 'move')
                }
              }}
            >
              <span className="brand-tagline">{nav.tagline}</span>
              {activeBrandId === 'tagline' && admin.editMode && (
                <>
                  <div className="editor-mini-toolbar editor-mini-toolbar--brand">
                    <button
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() =>
                        setBrand((current) => ({
                          ...current,
                          tagline: { ...current.tagline, fontSize: Math.max(10, (current.tagline.fontSize ?? 14) - 2) },
                        }))
                      }
                    >
                      A-
                    </button>
                    <button
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() =>
                        setBrand((current) => ({
                          ...current,
                          tagline: { ...current.tagline, fontSize: (current.tagline.fontSize ?? 14) + 2 },
                        }))
                      }
                    >
                      A+
                    </button>
                    <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => adjustBrandLayer('tagline', 1)}>
                      图层上
                    </button>
                    <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => adjustBrandLayer('tagline', -1)}>
                      图层下
                    </button>
                  </div>
                  <button
                    className="sticker-control sticker-control--delete brand-control"
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => deleteBrandItem(event, 'tagline')}
                  >
                    删除
                  </button>
                  <button
                    className="sticker-control sticker-control--reset brand-control"
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => resetBrandItem(event, 'tagline')}
                  >
                    重置
                  </button>
                  <span className="sticker-handle sticker-handle--resize" onPointerDown={(event) => startBrandDrag(event, 'tagline', 'resize')} />
                  <span className="sticker-handle sticker-handle--rotate" onPointerDown={(event) => startBrandDrag(event, 'tagline', 'rotate')} />
                </>
              )}
            </div>
          )}
        </div>
        <nav className="topnav" aria-label={nav.aria}>
          <a href="/">{nav.create}</a>
          <a href="/admin/licensor">{nav.admin}</a>
          <a href="/verify/AICOPHOTO-2026-000001">{nav.verify}</a>
          <div className="language-switch" role="group" aria-label="Theme">
            <button className={theme === 'day' ? 'is-active' : ''} type="button" onClick={() => setTheme('day')}>
              {nav.day}
            </button>
            <button className={theme === 'night' ? 'is-active' : ''} type="button" onClick={() => setTheme('night')}>
              {nav.night}
            </button>
          </div>
          <div className="language-switch" role="group" aria-label="Language">
            <button className={language === 'zh' ? 'is-active' : ''} type="button" onClick={() => setLanguage('zh')}>
              中文
            </button>
            <button className={language === 'ko' ? 'is-active' : ''} type="button" onClick={() => setLanguage('ko')}>
              한국어
            </button>
          </div>
        </nav>
      </header>
      {admin.editMode && activeItem && (
        <div className="brand-edit-status">
          正在编辑{activeBrandId === 'logo' ? ' LOGO' : '说明文字'}：拖动移动，右下角缩放，顶部旋转，Esc 保存退出
        </div>
      )}
      <main>{children}</main>
    </div>
  )
}
