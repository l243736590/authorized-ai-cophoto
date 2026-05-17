/* eslint-disable react-hooks/immutability, react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react'
import { useAdmin } from '../context/AdminContext'

const selectableSelector = 'h1,h2,h3,p,span,strong,small,dt,dd,legend,label,img'
const ignoredSelector =
  '.admin-editbar,.editor-mini-toolbar,.dom-editor-toolbar,.sticker-control,.sticker-handle,.language-switch,.brand-stage,.canvas-editable,.editable-sticker'
const domEditorStorageKey = 'authorized-ai-cophoto-dom-edits-v1'

interface DomSnapshot {
  element: HTMLElement
  cssText: string
  textContent: string | null
  contentEditable: string | null
  className: string
}

interface DragState {
  element: HTMLElement
  startX: number
  startY: number
  startLeft: number
  startTop: number
}

interface PersistedDomEdit {
  tagName: string
  cssText: string
  textContent?: string
}

type PersistedDomEdits = Record<string, PersistedDomEdit>

function loadPersistedDomEdits(): PersistedDomEdits {
  try {
    const saved = window.localStorage.getItem(domEditorStorageKey)
    return saved ? (JSON.parse(saved) as PersistedDomEdits) : {}
  } catch {
    return {}
  }
}

function savePersistedDomEdits(edits: PersistedDomEdits) {
  window.localStorage.setItem(domEditorStorageKey, JSON.stringify(edits))
}

function getElementEditPath(element: HTMLElement) {
  const parts: string[] = []
  let current: HTMLElement | null = element

  while (current && current !== document.body) {
    if (current.id) {
      parts.unshift(`#${CSS.escape(current.id)}`)
      break
    }

    const tagName = current.tagName.toLowerCase()
    const parent: HTMLElement | null = current.parentElement
    if (!parent) {
      break
    }

    const sameTagSiblings = Array.from(parent.children as HTMLCollectionOf<Element>).filter(
      (child: Element) => child.tagName.toLowerCase() === tagName,
    )
    const index = Math.max(1, sameTagSiblings.indexOf(current) + 1)
    parts.unshift(`${tagName}:nth-of-type(${index})`)
    current = parent
  }

  return parts.length ? parts.join(' > ') : ''
}

function persistElementEdit(element: HTMLElement) {
  const path = getElementEditPath(element)
  if (!path) {
    return
  }

  const edits = loadPersistedDomEdits()
  const edit: PersistedDomEdit = {
    tagName: element.tagName.toLowerCase(),
    cssText: element.style.cssText,
  }

  if (element.dataset.editorTextChanged === 'true' && element.tagName.toLowerCase() !== 'img') {
    edit.textContent = element.textContent || ''
  }

  edits[path] = edit
  savePersistedDomEdits(edits)
}

function applyPersistedDomEdits() {
  const edits = loadPersistedDomEdits()

  Object.entries(edits).forEach(([path, edit]) => {
    const element = document.querySelector<HTMLElement>(path)
    if (!element || element.tagName.toLowerCase() !== edit.tagName) {
      return
    }

    element.style.cssText = edit.cssText
    if (edit.textContent !== undefined && element.tagName.toLowerCase() !== 'img') {
      element.textContent = edit.textContent
      element.dataset.editorTextChanged = 'true'
    }
  })
}

function getNumericStyleValue(element: HTMLElement, property: 'left' | 'top') {
  const inlineValue = Number.parseFloat(element.style[property] || '0')
  return Number.isFinite(inlineValue) ? inlineValue : 0
}

function ensureMoveable(element: HTMLElement) {
  const style = window.getComputedStyle(element)
  if (style.position === 'static') {
    element.style.position = 'relative'
  }
}

export function DomElementEditor() {
  const admin = useAdmin()
  const [selected, setSelected] = useState<HTMLElement | null>(null)
  const [position, setPosition] = useState({ left: 0, top: 0 })
  const [dragState, setDragState] = useState<DragState | null>(null)
  const undoStackRef = useRef<DomSnapshot[]>([])
  const selectedRef = useRef<HTMLElement | null>(null)

  function updateToolbarPosition(element: HTMLElement) {
    const rect = element.getBoundingClientRect()
    setPosition({ left: Math.min(rect.left, window.innerWidth - 360), top: Math.max(12, rect.top - 54) })
  }

  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  useEffect(() => {
    const frame = window.requestAnimationFrame(applyPersistedDomEdits)
    return () => window.cancelAnimationFrame(frame)
  })

  function pushDomSnapshot(element = selectedRef.current) {
    if (!element) {
      return
    }

    undoStackRef.current = [
      ...undoStackRef.current.slice(-39),
      {
        element,
        cssText: element.style.cssText,
        textContent: element.tagName.toLowerCase() === 'img' ? null : element.textContent,
        contentEditable: element.getAttribute('contenteditable'),
        className: element.className,
      },
    ]
  }

  function undoLastChange() {
    const previous = undoStackRef.current.pop()
    if (!previous) {
      return
    }

    previous.element.style.cssText = previous.cssText
    previous.element.className = previous.className
    if (previous.textContent !== null) {
      previous.element.textContent = previous.textContent
    }

    if (previous.contentEditable === null) {
      previous.element.removeAttribute('contenteditable')
    } else {
      previous.element.setAttribute('contenteditable', previous.contentEditable)
    }

    previous.element.classList.add('dom-editable-selected')
    persistElementEdit(previous.element)
    setSelected(previous.element)
    updateToolbarPosition(previous.element)
    setDragState(null)
  }

  function clearSelection() {
    selectedRef.current?.classList.remove('dom-editable-selected')
    selectedRef.current?.removeAttribute('contenteditable')
    selectedRef.current = null
    setSelected(null)
    setDragState(null)
  }

  useEffect(() => {
    if (!admin.editMode) {
      clearSelection()
      return
    }

    function handleDoubleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      const element = target?.closest<HTMLElement>(selectableSelector)
      if (!element || element.closest(ignoredSelector)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      selectedRef.current?.classList.remove('dom-editable-selected')
      selectedRef.current?.removeAttribute('contenteditable')
      element.classList.add('dom-editable-selected')

      if (element.tagName.toLowerCase() !== 'img') {
        element.setAttribute('contenteditable', 'true')
        element.focus()
      }

      updateToolbarPosition(element)
      selectedRef.current = element
      setSelected(element)
    }

    function handlePointerDown(event: PointerEvent) {
      const element = selectedRef.current
      const target = event.target as HTMLElement | null
      if (!element || event.button !== 0 || !target || target.closest(ignoredSelector) || !element.contains(target)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      pushDomSnapshot(element)
      ensureMoveable(element)
      setDragState({
        element,
        startX: event.clientX,
        startY: event.clientY,
        startLeft: getNumericStyleValue(element, 'left'),
        startTop: getNumericStyleValue(element, 'top'),
      })
    }

    function handleInput(event: Event) {
      const element = selectedRef.current
      if (!element || event.target !== element || element.tagName.toLowerCase() === 'img') {
        return
      }

      element.dataset.editorTextChanged = 'true'
      persistElementEdit(element)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undoLastChange()
        return
      }

      if (event.key === 'Escape') {
        clearSelection()
      }
    }

    document.addEventListener('dblclick', handleDoubleClick, true)
    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('input', handleInput, true)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('dblclick', handleDoubleClick, true)
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('input', handleInput, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [admin.editMode])

  useEffect(() => {
    if (!dragState) {
      return
    }

    const currentDrag = dragState

    function handlePointerMove(event: PointerEvent) {
      currentDrag.element.style.left = `${currentDrag.startLeft + event.clientX - currentDrag.startX}px`
      currentDrag.element.style.top = `${currentDrag.startTop + event.clientY - currentDrag.startY}px`
      updateToolbarPosition(currentDrag.element)
    }

    function handlePointerUp() {
      persistElementEdit(currentDrag.element)
      setDragState(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp, { once: true })
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragState])

  if (!admin.editMode || !selected) {
    return null
  }

  const isImage = selected.tagName.toLowerCase() === 'img'

  function adjustFontSize(delta: number) {
    if (!selected || isImage) {
      return
    }

    pushDomSnapshot(selected)
    const current = Number.parseFloat(window.getComputedStyle(selected).fontSize) || 16
    selected.style.fontSize = `${Math.max(10, current + delta)}px`
    persistElementEdit(selected)
    updateToolbarPosition(selected)
  }

  function adjustImageWidth(delta: number) {
    if (!selected || !isImage) {
      return
    }

    pushDomSnapshot(selected)
    const rect = selected.getBoundingClientRect()
    selected.style.width = `${Math.max(60, rect.width + delta)}px`
    selected.style.height = 'auto'
    persistElementEdit(selected)
    updateToolbarPosition(selected)
  }

  function adjustLayer(delta: number) {
    if (!selected) {
      return
    }

    pushDomSnapshot(selected)
    ensureMoveable(selected)
    const current = Number.parseInt(window.getComputedStyle(selected).zIndex || '0', 10) || 0
    selected.style.zIndex = String(current + delta)
    persistElementEdit(selected)
  }

  function deleteSelected() {
    if (!selected) {
      return
    }

    pushDomSnapshot(selected)
    selected.style.display = 'none'
    persistElementEdit(selected)
    clearSelection()
  }

  return (
    <div className="dom-editor-toolbar" style={{ left: position.left, top: position.top }}>
      {isImage ? (
        <>
          <button type="button" onClick={() => adjustImageWidth(-24)}>
            缩小
          </button>
          <button type="button" onClick={() => adjustImageWidth(24)}>
            放大
          </button>
        </>
      ) : (
        <>
          <button type="button" onClick={() => adjustFontSize(-2)}>
            字号-
          </button>
          <button type="button" onClick={() => adjustFontSize(2)}>
            字号+
          </button>
        </>
      )}
      <button type="button" onClick={() => adjustLayer(1)}>
        图层上
      </button>
      <button type="button" onClick={() => adjustLayer(-1)}>
        图层下
      </button>
      <button type="button" onClick={deleteSelected}>
        删除
      </button>
    </div>
  )
}
