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
  startElement: CanvasElement
  centerX?: number
  centerY?: number
  startAngle?: number
}

const storageKey = 'authorized-ai-cophoto-editor-elements-v1'

function loadElements(): CanvasElement[] {
  try {
    const saved = window.localStorage.getItem(storageKey)
    return saved ? (JSON.parse(saved) as CanvasElement[]) : []
  } catch {
    return []
  }
}

function saveElements(elements: CanvasElement[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(elements))
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

          if (currentDrag.mode === 'move') {
            return { ...element, x: currentDrag.startElement.x + deltaX, y: currentDrag.startElement.y + deltaY }
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
    if (target.closest('button,.sticker-handle,.editor-mini-toolbar')) {
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
      x: Math.max(24, window.innerWidth / 2 - 140),
      y: 160,
      width: 280,
      rotation: 0,
      fontSize: 28,
      zIndex: 20 + elements.length,
    }
    pushUndoSnapshot()
    setElements((current) => [...current, next])
    setActiveId(next.id)
  }

  function addImage(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const next: CanvasElement = {
        id: `image-${Date.now()}`,
        type: 'image',
        content: String(reader.result),
        x: Math.max(24, window.innerWidth / 2 - 170),
        y: 180,
        width: 340,
        rotation: 0,
        fontSize: 16,
        zIndex: 30 + elements.length,
      }
      pushUndoSnapshot()
      setElements((current) => [...current, next])
      setActiveId(next.id)
    }
    reader.readAsDataURL(file)
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
