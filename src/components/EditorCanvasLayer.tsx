import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useAdmin } from '../context/AdminContext'

type CanvasElementType = 'text' | 'image'
type DragMode = 'move' | 'resize' | 'rotate'

interface CanvasElement {
  id: string
  type: CanvasElementType
  content: string
  x: number
  y: number
  width: number
  rotation: number
  fontSize: number
  zIndex: number
  deleted?: boolean
}

interface DragState {
  id: string
  mode: DragMode
  startX: number
  startY: number
  startScrollX: number
  startScrollY: number
  startElement: CanvasElement
  centerX?: number
  centerY?: number
  startAngle?: number
}

const storageKey = 'authorized-ai-cophoto-editor-elements-v2'
const maxStoredImageSide = 1200
const maxStoredImageBytes = 1_400_000
const transparentImageSides = [1200, 900, 700, 520, 380]

function loadElements(): CanvasElement[] {
  try {
    const saved = window.localStorage.getItem(storageKey)
    return saved ? (JSON.parse(saved) as CanvasElement[]) : []
  } catch {
    return []
  }
}

function saveElements(elements: CanvasElement[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(elements))
  } catch (error) {
    console.warn('Unable to persist editor elements. The uploaded image may be too large for localStorage.', error)
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

async function prepareImageForEditor(file: File) {
  const originalDataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(originalDataUrl)
  const naturalSide = Math.max(image.naturalWidth, image.naturalHeight)

  function renderToCanvas(maxSide: number) {
    const scale = Math.min(1, maxSide / naturalSide)
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) {
      return null
    }
    context.clearRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)
    return { canvas, context, width, height }
  }

  function hasTransparentPixels(context: CanvasRenderingContext2D, width: number, height: number) {
    const pixels = context.getImageData(0, 0, width, height).data
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] < 255) {
        return true
      }
    }
    return false
  }

  const firstRender = renderToCanvas(maxStoredImageSide)
  if (!firstRender) {
    return originalDataUrl
  }

  const isTransparent = hasTransparentPixels(firstRender.context, firstRender.width, firstRender.height)
  const firstPng = firstRender.canvas.toDataURL('image/png')
  if (firstPng.length <= maxStoredImageBytes) {
    return firstPng
  }

  if (isTransparent) {
    for (const side of transparentImageSides.slice(1)) {
      const render = renderToCanvas(side)
      if (!render) {
        continue
      }
      const pngDataUrl = render.canvas.toDataURL('image/png')
      if (pngDataUrl.length <= maxStoredImageBytes) {
        return pngDataUrl
      }
    }

    const smallestRender = renderToCanvas(transparentImageSides[transparentImageSides.length - 1])
    return smallestRender ? smallestRender.canvas.toDataURL('image/png') : originalDataUrl
  }

  return firstRender.canvas.toDataURL('image/jpeg', 0.82)
}

function getPointerAngle(clientX: number, clientY: number, centerX: number, centerY: number) {
  return (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI
}

export function EditorCanvasLayer() {
  const admin = useAdmin()
  const [elements, setElements] = useState<CanvasElement[]>(() => loadElements())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const elementRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const undoStackRef = useRef<CanvasElement[][]>([])
  const activeElement = useMemo(() => elements.find((element) => element.id === activeId && !element.deleted), [activeId, elements])

  function pushUndoSnapshot(snapshot = elements) {
    undoStackRef.current = [...undoStackRef.current.slice(-39), snapshot.map((element) => ({ ...element }))]
  }

  function undoLastChange() {
    const previous = undoStackRef.current.pop()
    if (!previous) {
      return
    }
    setElements(previous)
    setActiveId(null)
    setDragState(null)
  }

  useEffect(() => {
    saveElements(elements)
  }, [elements])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!admin.editMode) {
        return
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undoLastChange()
        return
      }

      if (event.key === 'Escape') {
        setActiveId(null)
        setDragState(null)
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && activeId) {
        pushUndoSnapshot()
        setElements((current) => current.map((element) => (element.id === activeId ? { ...element, deleted: true } : element)))
        setActiveId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeId, admin.editMode, elements])

  useEffect(() => {
    if (!dragState) {
      return
    }

    const currentDrag = dragState

    function handlePointerMove(event: PointerEvent) {
      setElements((current) =>
        current.map((element) => {
          if (element.id !== currentDrag.id) {
            return element
          }

          const deltaX = event.clientX - currentDrag.startX
          const deltaY = event.clientY - currentDrag.startY
          const scrollDeltaX = window.scrollX - currentDrag.startScrollX
          const scrollDeltaY = window.scrollY - currentDrag.startScrollY

          if (currentDrag.mode === 'move') {
            return {
              ...element,
              x: currentDrag.startElement.x + deltaX + scrollDeltaX,
              y: currentDrag.startElement.y + deltaY + scrollDeltaY,
            }
          }

          if (currentDrag.mode === 'resize') {
            return { ...element, width: Math.max(80, currentDrag.startElement.width + deltaX) }
          }

          if (
            currentDrag.mode === 'rotate' &&
            currentDrag.centerX !== undefined &&
            currentDrag.centerY !== undefined &&
            currentDrag.startAngle !== undefined
          ) {
            const currentAngle = getPointerAngle(event.clientX, event.clientY, currentDrag.centerX, currentDrag.centerY)
            return { ...element, rotation: currentDrag.startElement.rotation + currentAngle - currentDrag.startAngle }
          }

          return element
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

  function startDrag(event: ReactPointerEvent, element: CanvasElement, mode: DragMode) {
    if (!admin.editMode) {
      return
    }

    const target = event.target as HTMLElement
    if (mode === 'move' && target.closest('button,.sticker-handle,.editor-mini-toolbar')) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    pushUndoSnapshot()
    setActiveId(element.id)

    const rect = elementRefs.current[element.id]?.getBoundingClientRect()
    const centerX = rect ? rect.left + rect.width / 2 : element.x + element.width / 2
    const centerY = rect ? rect.top + rect.height / 2 : element.y + element.width / 2

    setDragState({
      id: element.id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startScrollX: window.scrollX,
      startScrollY: window.scrollY,
      startElement: element,
      centerX,
      centerY,
      startAngle: mode === 'rotate' ? getPointerAngle(event.clientX, event.clientY, centerX, centerY) : undefined,
    })
  }

  function addText() {
    const next: CanvasElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: '双击编辑文字',
      x: window.scrollX + Math.max(24, window.innerWidth / 2 - 140),
      y: window.scrollY + 160,
      width: 280,
      rotation: 0,
      fontSize: 28,
      zIndex: 20 + elements.length,
    }
    pushUndoSnapshot()
    setElements((current) => [...current, next])
    setActiveId(next.id)
  }

  async function addImage(file: File) {
    try {
      const content = await prepareImageForEditor(file)
      const next: CanvasElement = {
        id: `image-${Date.now()}`,
        type: 'image',
        content,
        x: window.scrollX + Math.max(24, window.innerWidth / 2 - 170),
        y: window.scrollY + 180,
        width: 340,
        rotation: 0,
        fontSize: 16,
        zIndex: 30 + elements.length,
      }
      pushUndoSnapshot()
      setElements((current) => [...current, next])
      setActiveId(next.id)
    } catch (error) {
      console.error('Failed to add image', error)
      window.alert('图片添加失败，请换一张尺寸更小的图片再试。')
    }
  }

  function updateElement(id: string, patch: Partial<CanvasElement>) {
    pushUndoSnapshot()
    setElements((current) => current.map((element) => (element.id === id ? { ...element, ...patch } : element)))
  }

  function adjustLayer(delta: number) {
    if (!activeElement) {
      return
    }
    updateElement(activeElement.id, { zIndex: Math.max(1, activeElement.zIndex + delta) })
  }

  function deleteActive() {
    if (!activeElement) {
      return
    }
    updateElement(activeElement.id, { deleted: true })
    setActiveId(null)
  }

  return (
    <>
      {admin.isAuthenticated && (
        <div className="admin-editbar">
          <strong>{admin.currentUser}</strong>
          <button type="button" onClick={() => admin.setEditMode(!admin.editMode)}>
            {admin.editMode ? '关闭编辑' : '开启编辑'}
          </button>
          <button type="button" disabled={!admin.editMode} onClick={addText}>
            添加文字
          </button>
          <button type="button" disabled={!admin.editMode} onClick={() => fileInputRef.current?.click()}>
            添加图片
          </button>
          <button type="button" onClick={admin.logout}>
            退出
          </button>
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                addImage(file)
              }
              event.currentTarget.value = ''
            }}
          />
        </div>
      )}

      {elements.map((element) => {
        if (element.deleted) {
          return null
        }

        const isActive = activeId === element.id && admin.editMode

        return (
          <div
            key={element.id}
            ref={(node) => {
              elementRefs.current[element.id] = node
            }}
            className={isActive ? 'canvas-editable is-active' : 'canvas-editable'}
            style={{
              left: element.x,
              top: element.y,
              width: element.width,
              zIndex: element.zIndex + (isActive ? 100 : 0),
              transform: `rotate(${element.rotation}deg)`,
            }}
            onDoubleClick={(event) => {
              if (!admin.editMode) {
                return
              }
              event.preventDefault()
              setActiveId(element.id)
            }}
            onPointerDown={(event) => {
              if (isActive) {
                startDrag(event, element, 'move')
              }
            }}
          >
            {element.type === 'image' ? (
              <img src={element.content} alt="管理员添加图片" draggable={false} />
            ) : (
              <div
                className="canvas-editable__text"
                contentEditable={isActive}
                suppressContentEditableWarning
                style={{ fontSize: element.fontSize }}
                onBlur={(event) => {
                  if (event.currentTarget.textContent !== element.content) {
                    updateElement(element.id, { content: event.currentTarget.textContent || '' })
                  }
                }}
              >
                {element.content}
              </div>
            )}

            {isActive && (
              <>
                <div className="editor-mini-toolbar">
                  {element.type === 'text' && (
                    <>
                      <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => updateElement(element.id, { fontSize: Math.max(10, element.fontSize - 2) })}>
                        A-
                      </button>
                      <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => updateElement(element.id, { fontSize: element.fontSize + 2 })}>
                        A+
                      </button>
                    </>
                  )}
                  <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => adjustLayer(1)}>
                    图层上
                  </button>
                  <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => adjustLayer(-1)}>
                    图层下
                  </button>
                  <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={deleteActive}>
                    删除
                  </button>
                </div>
                <span className="sticker-handle sticker-handle--resize" onPointerDown={(event) => startDrag(event, element, 'resize')} />
                <span className="sticker-handle sticker-handle--rotate" onPointerDown={(event) => startDrag(event, element, 'rotate')} />
              </>
            )}
          </div>
        )
      })}
    </>
  )
}
