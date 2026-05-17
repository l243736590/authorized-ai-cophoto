/* eslint-disable react-hooks/immutability, react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { useAdmin } from '../context/AdminContext'

const selectableSelector = 'h1,h2,h3,p,span,strong,small,dt,dd,legend,label,img'
const ignoredSelector = '.admin-editbar,.editor-mini-toolbar,.sticker-control,.sticker-handle,.language-switch,.brand-stage,.canvas-editable'

export function DomElementEditor() {
  const admin = useAdmin()
  const [selected, setSelected] = useState<HTMLElement | null>(null)
  const [position, setPosition] = useState({ left: 0, top: 0 })

  useEffect(() => {
    if (!admin.editMode) {
      selected?.classList.remove('dom-editable-selected')
      selected?.removeAttribute('contenteditable')
      setSelected(null)
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
      selected?.classList.remove('dom-editable-selected')
      selected?.removeAttribute('contenteditable')
      element.classList.add('dom-editable-selected')

      if (element.tagName.toLowerCase() !== 'img') {
        element.setAttribute('contenteditable', 'true')
        element.focus()
      }

      const rect = element.getBoundingClientRect()
      setPosition({ left: Math.min(rect.left, window.innerWidth - 320), top: Math.max(12, rect.top - 52) })
      setSelected(element)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        selected?.classList.remove('dom-editable-selected')
        selected?.removeAttribute('contenteditable')
        setSelected(null)
      }
    }

    document.addEventListener('dblclick', handleDoubleClick, true)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('dblclick', handleDoubleClick, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [admin.editMode, selected])

  if (!admin.editMode || !selected) {
    return null
  }

  const isImage = selected.tagName.toLowerCase() === 'img'

  function ensureLayerable() {
    if (!selected) {
      return
    }
    const style = window.getComputedStyle(selected)
    if (style.position === 'static') {
      selected.style.position = 'relative'
    }
  }

  function adjustFontSize(delta: number) {
    if (!selected || isImage) {
      return
    }
    const current = Number.parseFloat(window.getComputedStyle(selected).fontSize) || 16
    selected.style.fontSize = `${Math.max(10, current + delta)}px`
  }

  function adjustImageWidth(delta: number) {
    if (!selected || !isImage) {
      return
    }
    const rect = selected.getBoundingClientRect()
    selected.style.width = `${Math.max(60, rect.width + delta)}px`
    selected.style.height = 'auto'
  }

  function adjustLayer(delta: number) {
    if (!selected) {
      return
    }
    ensureLayerable()
    const current = Number.parseInt(window.getComputedStyle(selected).zIndex || '0', 10) || 0
    selected.style.zIndex = String(current + delta)
  }

  function deleteSelected() {
    if (!selected) {
      return
    }
    selected.style.display = 'none'
    selected.classList.remove('dom-editable-selected')
    selected.removeAttribute('contenteditable')
    setSelected(null)
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
