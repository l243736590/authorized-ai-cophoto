import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useAdmin } from '../context/AdminContext'

interface StickerState {
  id: string
  src: string
  alt: string
  x: number
  y: number
  width: number
  rotation: number
  zIndex: number
  deleted?: boolean
}

type DragMode = 'move' | 'resize' | 'rotate'

interface DragState {
  id: string
  mode: DragMode
  startX: number
  startY: number
  startSticker: StickerState
  centerX?: number
  centerY?: number
  startAngle?: number
}

const storageKey = 'authorized-ai-cophoto-stickers-v1'

function getDefaultStickers(): StickerState[] {
  const viewportWidth = window.innerWidth || 1440
  const viewportHeight = window.innerHeight || 820

  return [
    {
      id: 'son',
      src: '/references/son-heungmin-cutout.png',
      alt: '孙兴慜贴纸',
      x: viewportWidth >= 900 ? -120 : -140,
      y: viewportWidth >= 900 ? Math.max(330, viewportHeight - 500) : Math.max(330, viewportHeight - 360),
      width: viewportWidth >= 900 ? 520 : 240,
      rotation: 0,
      zIndex: 3,
    },
    {
      id: 'bean',
      src: '/references/mr-bean.png',
      alt: '憨豆贴纸',
      x: viewportWidth >= 900 ? -58 : -54,
      y: viewportWidth >= 900 ? 18 : 28,
      width: viewportWidth >= 900 ? 390 : 245,
      rotation: -30,
      zIndex: 5,
    },
    {
      id: 'zhang',
      src: '/references/zhang-wonyoung-cutout.png',
      alt: '张元英贴纸',
      x: viewportWidth >= 900 ? viewportWidth - 430 : viewportWidth - 100,
      y: viewportWidth >= 900 ? 250 : Math.max(250, viewportHeight - 360),
      width: viewportWidth >= 900 ? 520 : 240,
      rotation: 0,
      zIndex: 3,
    },
  ]
}

function loadStickers(): StickerState[] {
  try {
    const saved = window.localStorage.getItem(storageKey)
    if (!saved) {
      return getDefaultStickers()
    }

    const parsed = JSON.parse(saved) as StickerState[]
    const defaults = getDefaultStickers()
    return defaults.map((defaultSticker) => ({
      ...defaultSticker,
      ...parsed.find((sticker) => sticker.id === defaultSticker.id),
    }))
  } catch {
    return getDefaultStickers()
  }
}

function saveStickers(stickers: StickerState[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(stickers))
}

function getPointerAngle(clientX: number, clientY: number, centerX: number, centerY: number) {
  return (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI
}

export function EditableStickerLayer() {
  const admin = useAdmin()
  const [stickers, setStickers] = useState<StickerState[]>(() => loadStickers())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const stickerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const activeSticker = useMemo(
    () => stickers.find((sticker) => sticker.id === activeId && !sticker.deleted),
    [activeId, stickers],
  )

  useEffect(() => {
    saveStickers(stickers)
  }, [stickers])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!admin.editMode) {
        return
      }

      if (event.key === 'Escape') {
        saveStickers(stickers)
        setActiveId(null)
        setDragState(null)
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && activeId) {
        setStickers((current) => current.map((sticker) => (sticker.id === activeId ? { ...sticker, deleted: true } : sticker)))
        setActiveId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeId, admin.editMode, stickers])

  useEffect(() => {
    if (!dragState) {
      return
    }

    const currentDrag = dragState

    function handlePointerMove(event: PointerEvent) {
      setStickers((current) =>
        current.map((sticker) => {
          if (sticker.id !== currentDrag.id) {
            return sticker
          }

          const deltaX = event.clientX - currentDrag.startX
          const deltaY = event.clientY - currentDrag.startY

          if (currentDrag.mode === 'move') {
            return { ...sticker, x: currentDrag.startSticker.x + deltaX, y: currentDrag.startSticker.y + deltaY }
          }

          if (currentDrag.mode === 'resize') {
            return { ...sticker, width: Math.max(80, currentDrag.startSticker.width + deltaX) }
          }

          if (
            currentDrag.mode === 'rotate' &&
            currentDrag.centerX !== undefined &&
            currentDrag.centerY !== undefined &&
            currentDrag.startAngle !== undefined
          ) {
            const currentAngle = getPointerAngle(event.clientX, event.clientY, currentDrag.centerX, currentDrag.centerY)
            return { ...sticker, rotation: currentDrag.startSticker.rotation + currentAngle - currentDrag.startAngle }
          }

          return sticker
        }),
      )
    }

    function handlePointerUp() {
      setDragState(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp, { once: true })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragState])

  function startDrag(event: ReactPointerEvent, sticker: StickerState, mode: DragMode) {
    if (!admin.editMode) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    setActiveId(sticker.id)

    const rect = stickerRefs.current[sticker.id]?.getBoundingClientRect()
    const centerX = rect ? rect.left + rect.width / 2 : sticker.x + sticker.width / 2
    const centerY = rect ? rect.top + rect.height / 2 : sticker.y + sticker.width / 2

    setDragState({
      id: sticker.id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startSticker: sticker,
      centerX,
      centerY,
      startAngle: mode === 'rotate' ? getPointerAngle(event.clientX, event.clientY, centerX, centerY) : undefined,
    })
  }

  function updateSticker(id: string, patch: Partial<StickerState>) {
    setStickers((current) => current.map((sticker) => (sticker.id === id ? { ...sticker, ...patch } : sticker)))
  }

  function resetStickers() {
    const defaults = getDefaultStickers()
    setStickers(defaults)
    setActiveId(null)
    saveStickers(defaults)
  }

  return (
    <>
      {admin.editMode && <div className="sticker-edit-help">双击图片/文字编辑 · Esc 保存退出</div>}
      {stickers.map((sticker) => {
        if (sticker.deleted) {
          return null
        }

        const isActive = activeId === sticker.id && admin.editMode

        return (
          <div
            key={sticker.id}
            ref={(element) => {
              stickerRefs.current[sticker.id] = element
            }}
            className={isActive ? 'editable-sticker is-active' : 'editable-sticker'}
            style={{
              left: sticker.x,
              top: sticker.y,
              width: sticker.width,
              zIndex: sticker.zIndex + (isActive ? 10 : 0),
              transform: `rotate(${sticker.rotation}deg)`,
            }}
            onDoubleClick={(event) => {
              if (admin.editMode) {
                event.preventDefault()
                setActiveId(sticker.id)
              }
            }}
            onPointerDown={(event) => {
              if (isActive) {
                startDrag(event, sticker, 'move')
              }
            }}
          >
            <img src={sticker.src} alt={sticker.alt} draggable={false} />
            {isActive && (
              <>
                <div className="editor-mini-toolbar editor-mini-toolbar--sticker">
                  <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => updateSticker(sticker.id, { zIndex: sticker.zIndex + 1 })}>
                    图层上
                  </button>
                  <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => updateSticker(sticker.id, { zIndex: Math.max(1, sticker.zIndex - 1) })}>
                    图层下
                  </button>
                </div>
                <button
                  className="sticker-control sticker-control--delete"
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => {
                    updateSticker(sticker.id, { deleted: true })
                    setActiveId(null)
                  }}
                >
                  删除
                </button>
                <button
                  className="sticker-control sticker-control--reset"
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={resetStickers}
                >
                  重置
                </button>
                <span className="sticker-handle sticker-handle--resize" onPointerDown={(event) => startDrag(event, sticker, 'resize')} />
                <span className="sticker-handle sticker-handle--rotate" onPointerDown={(event) => startDrag(event, sticker, 'rotate')} />
              </>
            )}
          </div>
        )
      })}
      {admin.editMode && activeSticker && <div className="sticker-edit-status">正在编辑：拖动移动，右下角缩放，顶部旋转，Esc 保存</div>}
    </>
  )
}
