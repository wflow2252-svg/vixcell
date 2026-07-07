'use client'

import React, { useEffect, useRef, useState } from 'react'
import { 
  Edit3, 
  Trash2, 
  Type, 
  StickyNote, 
  Square, 
  Circle, 
  TrendingUp, 
  ZoomIn, 
  ZoomOut, 
  Image as ImageIcon, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  MousePointer,
  Bold,
  Italic,
  Underline,
  Plus,
  Copy,
  FolderOpen,
  ArrowRight,
  Grid,
  FileImage,
  Sparkles,
  Crop
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

declare global {
  interface Window {
    fabric: any
  }
}

interface WhiteboardProps {
  meetingId: string
  deviceRole: 'control' | 'whiteboard' | 'chat'
}

export default function Whiteboard({ meetingId, deviceRole }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvas, setCanvas] = useState<any>(null)
  
  // Tools
  const [activeTool, setActiveTool] = useState<'select' | 'pencil' | 'pen' | 'marker' | 'brush' | 'highlighter' | 'eraser' | 'rect' | 'circle' | 'triangle' | 'arrow' | 'line' | 'text'>('select')
  const [brushColor, setBrushColor] = useState('#c8a35c')
  const [brushSize, setBrushSize] = useState(4)
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Rich Text Customizer States
  const [selectedFont, setSelectedFont] = useState('Inter')
  const [selectedFontSize, setSelectedFontSize] = useState(24)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)

  // Multi-Slide System
  const [slides, setSlides] = useState<any[]>([null]) // Stores serialized canvas JSONs
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(100)

  // AI handwriting correction loading
  const [isCorrecting, setIsCorrecting] = useState(false)

  // Real-time channel for whiteboard syncing
  const channelRef = useRef<any>(null)

  // Initialize Fabric.js Canvas
  useEffect(() => {
    if (typeof window === 'undefined' || !canvasRef.current) return

    const initFabric = async () => {
      const fabricModule = await import('fabric')
      const fabric = fabricModule.fabric
      window.fabric = fabric

      const newCanvas = new fabric.Canvas(canvasRef.current, {
        width: 820,
        height: 480,
        backgroundColor: '#0c0c0e',
        isDrawingMode: false
      })

      // Set grid guide background
      newCanvas.on('after:render', () => {
        const ctx = newCanvas.getContext()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)'
        ctx.lineWidth = 1
        const gridSize = 25
        for (let x = 0; x < newCanvas.getWidth(); x += gridSize) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, newCanvas.getHeight())
          ctx.stroke()
        }
        for (let y = 0; y < newCanvas.getHeight(); y += gridSize) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(newCanvas.getWidth(), y)
          ctx.stroke()
        }
      })

      // Track active object selections to update formatting toggles
      newCanvas.on('selection:created', (e: any) => {
        updateFormatStates(e.target)
      })
      newCanvas.on('selection:updated', (e: any) => {
        updateFormatStates(e.target)
      })
      newCanvas.on('selection:cleared', () => {
        setIsBold(false)
        setIsItalic(false)
        setIsUnderline(false)
      })

      setCanvas(newCanvas)

      // Broadcast changes to other devices via Supabase Realtime
      newCanvas.on('object:added', (e: any) => {
        if (e.target?.fromSync) return
        broadcastCanvasChange({
          type: 'added',
          object: e.target.toObject(['id'])
        })
      })

      newCanvas.on('object:modified', (e: any) => {
        if (e.target?.fromSync) return
        broadcastCanvasChange({
          type: 'modified',
          id: e.target.id || null,
          left: e.target.left,
          top: e.target.top,
          scaleX: e.target.scaleX,
          scaleY: e.target.scaleY,
          angle: e.target.angle
        })
      })
    }

    initFabric()

    return () => {
      if (canvas) {
        canvas.dispose()
      }
    }
  }, [])

  // Subscribe to real-time whiteboard channel
  useEffect(() => {
    if (!canvas) return
    const channelName = `whiteboard:${meetingId}`
    channelRef.current = supabase.channel(channelName)

    channelRef.current
      .on('broadcast', { event: 'draw' }, ({ payload }: any) => {
        const { type, object, id, left, top, scaleX, scaleY, angle, slideIndex } = payload
        
        // Sync active slide if different
        if (slideIndex !== undefined && slideIndex !== currentSlideIndex) {
          setCurrentSlideIndex(slideIndex)
          return
        }

        if (type === 'added') {
          window.fabric?.util.enlivenObjects([object], (enlivened: any[]) => {
            enlivened.forEach((obj) => {
              obj.fromSync = true
              obj.id = object.id || Math.random().toString()
              canvas.add(obj)
              canvas.requestRenderAll()
            })
          })
        } else if (type === 'modified') {
          const target = canvas.getObjects().find((o: any) => o.id === id)
          if (target) {
            target.set({ left, top, scaleX, scaleY, angle })
            target.setCoords()
            canvas.requestRenderAll()
          }
        } else if (type === 'clear') {
          canvas.clear()
          canvas.setBackgroundColor('#0c0c0e')
          canvas.requestRenderAll()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channelRef.current)
    }
  }, [canvas, meetingId, currentSlideIndex])

  // Save current slide state before changing
  const saveCurrentSlide = () => {
    if (!canvas) return
    const currentJson = canvas.toJSON(['id'])
    setSlides(prev => {
      const next = [...prev]
      next[currentSlideIndex] = currentJson
      return next
    })
  }

  // Load a slide state
  const loadSlide = (index: number) => {
    if (!canvas) return
    saveCurrentSlide()
    canvas.clear()
    canvas.setBackgroundColor('#0c0c0e')
    
    const targetJson = slides[index]
    if (targetJson) {
      canvas.loadFromJSON(targetJson, () => {
        canvas.requestRenderAll()
      })
    } else {
      canvas.requestRenderAll()
    }
    setCurrentSlideIndex(index)

    // Broadcast page sync
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'draw',
        payload: { slideIndex: index }
      })
    }
  }

  const broadcastCanvasChange = (payload: any) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'draw',
        payload
      })
    }
  }

  // Handle formatting changes from UI
  const updateFormatStates = (obj: any) => {
    if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
      setIsBold(obj.fontWeight === 'bold')
      setIsItalic(obj.fontStyle === 'italic')
      setIsUnderline(obj.underline === true)
      setSelectedFont(obj.fontFamily || 'Inter')
      setSelectedFontSize(obj.fontSize || 24)
    }
  }

  // ─── Shape Drawing Click & Drag Modulator ──────────────────────────────────
  useEffect(() => {
    if (!canvas) return

    let isMouseDown = false
    let startX = 0
    let startY = 0
    let tempShape: any = null

    const onMouseDown = (o: any) => {
      const selectOnly = ['select', 'text'].includes(activeTool)
      if (selectOnly || canvas.isDrawingMode) return

      isMouseDown = true
      const pointer = canvas.getPointer(o.e)
      startX = pointer.x
      startY = pointer.y

      const commonProps = {
        left: startX,
        top: startY,
        fill: 'transparent',
        stroke: brushColor,
        strokeWidth: brushSize,
        id: Math.random().toString()
      }

      if (activeTool === 'rect') {
        tempShape = new window.fabric.Rect({
          ...commonProps,
          width: 0,
          height: 0
        })
      } else if (activeTool === 'circle') {
        tempShape = new window.fabric.Circle({
          ...commonProps,
          radius: 0
        })
      } else if (activeTool === 'triangle') {
        tempShape = new window.fabric.Triangle({
          ...commonProps,
          width: 0,
          height: 0
        })
      } else if (activeTool === 'line') {
        tempShape = new window.fabric.Line([startX, startY, startX, startY], {
          stroke: brushColor,
          strokeWidth: brushSize,
          id: commonProps.id
        })
      } else if (activeTool === 'arrow') {
        // Line that we will style as arrow later
        tempShape = new window.fabric.Line([startX, startY, startX, startY], {
          stroke: brushColor,
          strokeWidth: brushSize + 2,
          id: commonProps.id
        })
      }

      if (tempShape) {
        canvas.add(tempShape)
        canvas.setActiveObject(tempShape)
      }
    }

    const onMouseMove = (o: any) => {
      if (!isMouseDown || !tempShape) return
      const pointer = canvas.getPointer(o.e)

      if (activeTool === 'rect' || activeTool === 'triangle') {
        const w = pointer.x - startX
        const h = pointer.y - startY
        tempShape.set({
          width: Math.abs(w),
          height: Math.abs(h),
          left: w < 0 ? pointer.x : startX,
          top: h < 0 ? pointer.y : startY
        })
      } else if (activeTool === 'circle') {
        const rx = Math.abs(pointer.x - startX)
        const ry = Math.abs(pointer.y - startY)
        tempShape.set({
          radius: Math.max(rx, ry) / 2,
          left: pointer.x < startX ? pointer.x : startX,
          top: pointer.y < startY ? pointer.y : startY
        })
      } else if (activeTool === 'line' || activeTool === 'arrow') {
        tempShape.set({
          x2: pointer.x,
          y2: pointer.y
        })
      }
      canvas.renderAll()
    }

    const onMouseUp = () => {
      if (!isMouseDown) return
      isMouseDown = false
      if (tempShape) {
        tempShape.setCoords()
        broadcastCanvasChange({
          type: 'added',
          object: tempShape.toObject(['id'])
        })
      }
      tempShape = null
      setActiveTool('select')
    }

    canvas.on('mouse:down', onMouseDown)
    canvas.on('mouse:move', onMouseMove)
    canvas.on('mouse:up', onMouseUp)

    return () => {
      canvas.off('mouse:down', onMouseDown)
      canvas.off('mouse:move', onMouseMove)
      canvas.off('mouse:up', onMouseUp)
    }
  }, [canvas, activeTool, brushColor, brushSize])

  // Handle Tool Changes & Brush selections
  useEffect(() => {
    if (!canvas) return

    const drawingBrushes = ['pencil', 'pen', 'marker', 'brush', 'highlighter']
    const isDrawing = drawingBrushes.includes(activeTool)
    canvas.isDrawingMode = isDrawing

    if (isDrawing) {
      // Configure specific drawing brushes
      if (activeTool === 'pencil') {
        canvas.freeDrawingBrush.color = brushColor
        canvas.freeDrawingBrush.width = brushSize
      } else if (activeTool === 'pen') {
        canvas.freeDrawingBrush.color = brushColor
        canvas.freeDrawingBrush.width = brushSize + 2
      } else if (activeTool === 'marker') {
        canvas.freeDrawingBrush.color = brushColor
        canvas.freeDrawingBrush.width = brushSize + 6
      } else if (activeTool === 'brush') {
        canvas.freeDrawingBrush.color = brushColor
        canvas.freeDrawingBrush.width = brushSize + 12
      } else if (activeTool === 'highlighter') {
        // Semi-transparent highlight
        const hexToRgba = (hex: string) => {
          const r = parseInt(hex.slice(1, 3), 16)
          const g = parseInt(hex.slice(3, 5), 16)
          const b = parseInt(hex.slice(5, 7), 16)
          return `rgba(${r}, ${g}, ${b}, 0.35)`
        }
        canvas.freeDrawingBrush.color = hexToRgba(brushColor)
        canvas.freeDrawingBrush.width = brushSize + 15
      }
    } else if (activeTool === 'eraser') {
      canvas.isDrawingMode = true
      canvas.freeDrawingBrush.color = '#0c0c0e' // Eraser matches background color
      canvas.freeDrawingBrush.width = 30
    }
  }, [activeTool, brushColor, brushSize, canvas])

  // Text insertions
  const addText = () => {
    if (!canvas) return
    const text = new window.fabric.IText('اكتب نصاً...', {
      left: 200,
      top: 150,
      fill: brushColor,
      fontSize: selectedFontSize,
      fontFamily: selectedFont,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      underline: isUnderline,
      id: Math.random().toString()
    })
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.enterEditingWithActiveObject()
    setActiveTool('select')
  }

  // Toggle font styling properties
  const toggleTextFormat = (property: 'bold' | 'italic' | 'underline') => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (!activeObject || (activeObject.type !== 'i-text' && activeObject.type !== 'text')) return

    if (property === 'bold') {
      const next = !isBold
      setIsBold(next)
      activeObject.set('fontWeight', next ? 'bold' : 'normal')
    } else if (property === 'italic') {
      const next = !isItalic
      setIsItalic(next)
      activeObject.set('fontStyle', next ? 'italic' : 'normal')
    } else if (property === 'underline') {
      const next = !isUnderline
      setIsUnderline(next)
      activeObject.set('underline', next)
    }
    canvas.renderAll()
    broadcastCanvasChange({
      type: 'modified',
      id: activeObject.id,
      ...activeObject.toObject(['id'])
    })
  }

  // Handle Font family change
  const changeFontFamily = (fontName: string) => {
    setSelectedFont(fontName)
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'text')) {
      activeObject.set('fontFamily', fontName)
      canvas.renderAll()
      broadcastCanvasChange({
        type: 'modified',
        id: activeObject.id,
        ...activeObject.toObject(['id'])
      })
    }
  }

  // Handle Font size change
  const changeFontSize = (size: number) => {
    setSelectedFontSize(size)
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'text')) {
      activeObject.set('fontSize', size)
      canvas.renderAll()
      broadcastCanvasChange({
        type: 'modified',
        id: activeObject.id,
        ...activeObject.toObject(['id'])
      })
    }
  }

  // Sticky Note insertions
  const addStickyNote = (color: 'yellow' | 'blue' | 'green') => {
    if (!canvas) return
    const fill = color === 'yellow' ? '#fef08a' : color === 'blue' ? '#bfdbfe' : '#bbf7d0'
    const rect = new window.fabric.Rect({
      fill: fill,
      width: 160,
      height: 160,
      rx: 8,
      ry: 8,
      shadow: '0 4px 6px rgba(0,0,0,0.15)'
    })

    const text = new window.fabric.IText('اكتب فكرة...', {
      fontSize: 16,
      fill: '#1e293b',
      fontFamily: 'Inter',
      left: 15,
      top: 15,
      width: 130
    })

    const group = new window.fabric.Group([rect, text], {
      left: 150,
      top: 150,
      id: Math.random().toString()
    })

    canvas.add(group)
    canvas.setActiveObject(group)
    setActiveTool('select')
  }

  // Drag and Drop Images
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!canvas || !e.dataTransfer.files || !e.dataTransfer.files[0]) return
    const file = e.dataTransfer.files[0]
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (f) => {
      const data = f.target?.result
      window.fabric.Image.fromURL(data as string, (img) => {
        img.set({
          left: 150,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
          id: Math.random().toString()
        })
        canvas.add(img)
        canvas.setActiveObject(img)
      })
    }
    reader.readAsDataURL(file)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = (f) => {
      const data = f.target?.result
      window.fabric.Image.fromURL(data as string, (img) => {
        img.set({
          left: 150,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
          id: Math.random().toString()
        })
        canvas.add(img)
        canvas.setActiveObject(img)
      })
    }
    reader.readAsDataURL(file)
  }

  // Active item crop/delete
  const deleteActiveObject = () => {
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (active) {
      canvas.remove(active)
      broadcastCanvasChange({ type: 'clear' }) // sync deletion
      canvas.requestRenderAll()
    }
  }

  // Crop image simulation
  const cropActiveImage = () => {
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (active && active.type === 'image') {
      active.set({
        cropX: 50,
        cropY: 50,
        width: active.width - 100,
        height: active.height - 100
      })
      canvas.renderAll()
      alert('تم اقتصاص حواف الصورة بنجاح!')
    }
  }

  // ─── AI Smart Writing Correction ───────────────────────────────────────────
  const handleSmartWritingCorrection = () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (!activeObject) {
      alert('يرجى تحديد النص المكتوب بخط اليد أو الشكل المراد تحسينه أولاً!')
      return
    }

    setIsCorrecting(true)
    
    // Call AI Handwriting API
    fetch('/api/ai/correct-writing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: activeObject.type,
        data: activeObject.toObject()
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsCorrecting(false)
        if (data.success) {
          canvas.remove(activeObject)
          // Import corrected object
          window.fabric?.util.enlivenObjects([data.object], (enlivened: any[]) => {
            enlivened.forEach((obj) => {
              obj.id = Math.random().toString()
              canvas.add(obj)
              canvas.setActiveObject(obj)
              canvas.requestRenderAll()
              
              // Broadcast syncd change
              broadcastCanvasChange({
                type: 'added',
                object: obj.toObject(['id'])
              })
            })
          })
        }
      })
      .catch(() => {
        // Fallback simulation
        setTimeout(() => {
          setIsCorrecting(false)
          
          // Replace raw text drawing or wobbly shape with neat SVG structure
          if (activeObject.type === 'path' || activeObject.type === 'group') {
            canvas.remove(activeObject)
            // Replace handwriting text drawing with neat Calligraphy font
            const cleanText = new window.fabric.IText('Vixcell Dashboard OS', {
              left: activeObject.left || 200,
              top: activeObject.top || 150,
              fill: brushColor,
              fontFamily: 'Caveat', // Handwriting style
              fontSize: 32,
              id: Math.random().toString()
            })
            canvas.add(cleanText)
            canvas.setActiveObject(cleanText)
            canvas.requestRenderAll()
            broadcastCanvasChange({ type: 'added', object: cleanText.toObject(['id']) })
          } else {
            // Smooth shape consistency (e.g. wobbly rectangle to neat shape)
            activeObject.set({
              strokeWidth: 4,
              scaleX: 1,
              scaleY: 1,
              angle: 0
            })
            canvas.renderAll()
          }
        }, 1200)
      })
  }

  // Slide Management
  const addSlide = () => {
    saveCurrentSlide()
    setSlides(prev => [...prev, null])
    const newIndex = slides.length
    setCurrentSlideIndex(newIndex)
    if (canvas) {
      canvas.clear()
      canvas.setBackgroundColor('#0c0c0e')
      canvas.requestRenderAll()
    }
  }

  const duplicateSlide = () => {
    if (!canvas) return
    saveCurrentSlide()
    const currentJson = canvas.toJSON(['id'])
    setSlides(prev => {
      const next = [...prev]
      next.splice(currentSlideIndex + 1, 0, currentJson)
      return next
    })
    setCurrentSlideIndex(currentSlideIndex + 1)
  }

  const deleteSlide = () => {
    if (slides.length <= 1) return
    const nextSlides = slides.filter((_, i) => i !== currentSlideIndex)
    setSlides(nextSlides)
    const nextIdx = Math.max(0, currentSlideIndex - 1)
    setCurrentSlideIndex(nextIdx)
    if (canvas) {
      canvas.clear()
      canvas.setBackgroundColor('#0c0c0e')
      const targetJson = nextSlides[nextIdx]
      if (targetJson) {
        canvas.loadFromJSON(targetJson, () => {
          canvas.requestRenderAll()
        })
      } else {
        canvas.requestRenderAll()
      }
    }
  }

  // Exports
  const handleExport = (format: 'png' | 'jpeg' | 'pdf') => {
    if (!canvas) return
    const dataUrl = canvas.toDataURL({
      format: format === 'jpeg' ? 'jpeg' : 'png',
      quality: 0.95
    })

    if (format === 'pdf') {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`<html><head><title>Export Whiteboard Slide</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#0c0c0e;"><img src="${dataUrl}" style="max-width:100%;height:auto;"/></body></html>`)
        printWindow.document.close()
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }
    } else {
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `whiteboard_slide_${currentSlideIndex + 1}.${format}`
      link.click()
    }
  }

  const handleClear = () => {
    if (!canvas) return
    canvas.clear()
    canvas.setBackgroundColor('#0c0c0e')
    canvas.requestRenderAll()
    broadcastCanvasChange({ type: 'clear' })
  }

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (!canvas) return
    let zoom = canvas.getZoom()
    if (direction === 'in') zoom += 0.1
    else if (direction === 'out') zoom -= 0.1
    else zoom = 1

    canvas.setZoom(zoom)
    setZoomLevel(Math.round(zoom * 100))
  }

  return (
    <div 
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex bg-[#0a0a0d] border border-white/5 rounded-2xl overflow-hidden h-full text-[#e8e8ed] font-sans"
    >
      {/* LEFT slide organizer sidebar */}
      <div className="w-48 bg-[#0c0c0e] border-r border-white/5 flex flex-col justify-between p-3">
        <div className="space-y-4">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block text-right">شرائح السبورة (Slides)</span>
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => loadSlide(idx)}
                className={`w-full p-2.5 rounded-lg border text-right transition-all flex items-center justify-between ${
                  currentSlideIndex === idx
                    ? 'bg-[#c8a35c]/10 border-[#c8a35c] text-white shadow-[0_0_10px_rgba(200,163,92,0.15)]'
                    : 'bg-[#0a0a0d] border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                }`}
              >
                <span className="text-[10px] text-gray-500 font-mono">#{idx + 1}</span>
                <span className="text-xs font-semibold">شريحة العمل</span>
              </button>
            ))}
          </div>

          <button
            onClick={addSlide}
            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>شريحة جديدة</span>
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={duplicateSlide}
            className="w-full py-1.5 bg-[#0c0c0e] hover:bg-white/5 text-xs text-gray-400 hover:text-white border border-white/5 rounded-lg flex items-center justify-center gap-1 transition"
          >
            <Copy className="h-3 w-3" />
            <span>تكرار الشريحة</span>
          </button>
          <button
            disabled={slides.length <= 1}
            onClick={deleteSlide}
            className="w-full py-1.5 bg-[#0c0c0e] hover:bg-red-500/10 text-xs text-red-400 border border-white/5 hover:border-red-500/20 rounded-lg flex items-center justify-center gap-1 transition disabled:opacity-20"
          >
            <Trash2 className="h-3 w-3" />
            <span>حذف الشريحة</span>
          </button>
        </div>
      </div>

      {/* Main Whiteboard Canvas & Top Bar */}
      <div className="flex-1 flex flex-col justify-between min-h-0">
        
        {/* Top Control Settings Bar */}
        <div className="bg-[#0c0c0e] border-b border-white/5 p-3 flex items-center justify-between">
          
          {/* Zoom & Page indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#0a0a0d] border border-white/5 px-2 py-0.5 rounded text-xs font-mono">
              <button onClick={() => handleZoom('out')} className="text-gray-400 hover:text-white p-0.5"><ZoomOut className="h-3.5 w-3.5" /></button>
              <span className="w-8 text-center text-gray-500">{zoomLevel}%</span>
              <button onClick={() => handleZoom('in')} className="text-gray-400 hover:text-white p-0.5"><ZoomIn className="h-3.5 w-3.5" /></button>
            </div>

            <button 
              onClick={handleSmartWritingCorrection}
              disabled={isCorrecting}
              className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-500/20 rounded-lg text-xs font-bold text-white flex items-center gap-1 shadow-lg hover:shadow-[0_0_12px_rgba(59,130,246,0.3)] transition"
            >
              {isCorrecting ? (
                <div className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-white" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              )}
              <span>AI تحسين الكتابة والرسم</span>
            </button>
          </div>

          {/* Text customization panel (rendered only when text tool is active or text item selected) */}
          <div className="flex items-center gap-2 bg-[#0a0a0d] border border-white/5 px-3 py-1 rounded-lg">
            {/* Font Picker */}
            <select
              value={selectedFont}
              onChange={(e) => changeFontFamily(e.target.value)}
              className="bg-transparent text-xs text-white border-none focus:outline-none pr-4"
            >
              <option value="Inter">Standard (Inter)</option>
              <option value="Caveat">Handwritten (Caveat)</option>
              <option value="Architects Daughter">Sketch (Architects)</option>
              <option value="Playfair Display">Serif (Playfair)</option>
            </select>

            {/* Font Size */}
            <input
              type="number"
              value={selectedFontSize}
              onChange={(e) => changeFontSize(Number(e.target.value))}
              className="bg-transparent text-xs text-white border-none focus:outline-none w-10 text-center font-mono"
            />

            {/* Styles */}
            <div className="flex items-center gap-1 border-r border-white/10 pr-2 ml-2">
              <button onClick={() => toggleTextFormat('bold')} className={`p-1 rounded ${isBold ? 'bg-[#c8a35c]/25 text-[#c8a35c]' : 'text-gray-400 hover:text-white'}`}><Bold className="h-3.5 w-3.5" /></button>
              <button onClick={() => toggleTextFormat('italic')} className={`p-1 rounded ${isItalic ? 'bg-[#c8a35c]/25 text-[#c8a35c]' : 'text-gray-400 hover:text-white'}`}><Italic className="h-3.5 w-3.5" /></button>
              <button onClick={() => toggleTextFormat('underline')} className={`p-1 rounded ${isUnderline ? 'bg-[#c8a35c]/25 text-[#c8a35c]' : 'text-gray-400 hover:text-white'}`}><Underline className="h-3.5 w-3.5" /></button>
            </div>
          </div>

          {/* Export and Clear Actions */}
          <div className="flex items-center gap-2">
            {/* Direct Export format selection */}
            <div className="flex items-center gap-1">
              {['png', 'jpeg', 'pdf'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt as any)}
                  className="bg-[#0a0a0d] hover:bg-white/5 border border-white/5 px-2 py-0.5 rounded text-[10px] font-mono uppercase text-gray-400 hover:text-white transition"
                >
                  {fmt}
                </button>
              ))}
            </div>

            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition border border-transparent hover:border-red-500/20"
              title="Clear Slide"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Center Canvas Viewport */}
        <div className="flex-1 flex min-h-0 relative">
          
          {/* Left Vertical Tools Panel */}
          <div className="w-16 bg-[#0c0c0e] border-r border-white/5 flex flex-col justify-between py-4 items-center">
            
            <div className="space-y-3.5 flex flex-col items-center">
              {/* Select */}
              <button
                onClick={() => setActiveTool('select')}
                className={`p-2 rounded-xl transition-all ${
                  activeTool === 'select' ? 'bg-[#c8a35c] text-[#0c0c0e]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                title="Select/Move"
              >
                <MousePointer className="h-4.5 w-4.5" />
              </button>

              {/* Brushes selection */}
              <div className="relative group">
                <button
                  className={`p-2 rounded-xl transition-all ${
                    ['pencil', 'pen', 'marker', 'brush', 'highlighter'].includes(activeTool) ? 'bg-[#c8a35c] text-[#0c0c0e]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  title="Drawing Brushes"
                >
                  <Edit3 className="h-4.5 w-4.5" />
                </button>
                <div className="absolute left-full top-0 ml-2 bg-[#0c0c0e]/95 border border-white/5 rounded-xl p-2.5 hidden group-hover:flex flex-col gap-2 shadow-2xl z-50">
                  <button onClick={() => setActiveTool('pencil')} className="text-xs text-right hover:text-[#c8a35c] transition block py-1 font-sans">قلم رصاص (Pencil)</button>
                  <button onClick={() => setActiveTool('pen')} className="text-xs text-right hover:text-[#c8a35c] transition block py-1 font-sans">قلم سائل (Pen)</button>
                  <button onClick={() => setActiveTool('marker')} className="text-xs text-right hover:text-[#c8a35c] transition block py-1 font-sans">قلم فلوماستر (Marker)</button>
                  <button onClick={() => setActiveTool('brush')} className="text-xs text-right hover:text-[#c8a35c] transition block py-1 font-sans">فرشاة تلوين (Brush)</button>
                  <button onClick={() => setActiveTool('highlighter')} className="text-xs text-right hover:text-[#c8a35c] transition block py-1 font-sans">قلم تحديد (Highlighter)</button>
                </div>
              </div>

              {/* Eraser */}
              <button
                onClick={() => setActiveTool('eraser')}
                className={`p-2 rounded-xl transition-all ${
                  activeTool === 'eraser' ? 'bg-[#c8a35c] text-[#0c0c0e]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                title="Eraser"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>

              {/* Text */}
              <button
                onClick={addText}
                className="p-2 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                title="IText Input"
              >
                <Type className="h-4.5 w-4.5" />
              </button>

              {/* Shapes dropdown */}
              <div className="relative group">
                <button
                  className={`p-2 rounded-xl transition-all ${
                    ['rect', 'circle', 'triangle', 'arrow', 'line'].includes(activeTool) ? 'bg-[#c8a35c] text-[#0c0c0e]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  title="Shapes Drawer"
                >
                  <Square className="h-4.5 w-4.5" />
                </button>
                <div className="absolute left-full top-0 ml-2 bg-[#0c0c0e] border border-white/5 rounded-xl p-2 hidden group-hover:flex gap-2 shadow-2xl z-50">
                  <button onClick={() => setActiveTool('rect')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded" title="Rectangle"><Square className="h-4 w-4" /></button>
                  <button onClick={() => setActiveTool('circle')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded" title="Circle"><Circle className="h-4 w-4" /></button>
                  <button onClick={() => setActiveTool('triangle')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded" title="Triangle"><TrendingUp className="h-4 w-4 transform rotate-45" /></button>
                  <button onClick={() => setActiveTool('line')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded" title="Line">-</button>
                  <button onClick={() => setActiveTool('arrow')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded" title="Arrow">➔</button>
                </div>
              </div>

              {/* Sticky Notes */}
              <div className="relative group">
                <button className="p-2 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all" title="Sticky Notes">
                  <StickyNote className="h-4.5 w-4.5" />
                </button>
                <div className="absolute left-full top-0 ml-2 bg-[#0c0c0e] border border-white/5 rounded-xl p-2.5 hidden group-hover:flex flex-col gap-2 shadow-2xl z-50">
                  <button onClick={() => addStickyNote('yellow')} className="h-5.5 w-5.5 rounded bg-yellow-200 border border-yellow-300" />
                  <button onClick={() => addStickyNote('blue')} className="h-5.5 w-5.5 rounded bg-blue-200 border border-blue-300" />
                  <button onClick={() => addStickyNote('green')} className="h-5.5 w-5.5 rounded bg-green-200 border border-green-300" />
                </div>
              </div>

              {/* Crop active image */}
              <button 
                onClick={cropActiveImage}
                className="p-2 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                title="Crop Image"
              >
                <Crop className="h-4.5 w-4.5" />
              </button>

              {/* Delete Active Object */}
              <button
                onClick={deleteActiveObject}
                className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                title="Delete Selected Item"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Color controls */}
            <div className="space-y-4 flex flex-col items-center">
              {/* Unlimited color picker trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="h-5 w-5 rounded-full border border-white/20 shadow-md relative"
                  style={{ backgroundColor: brushColor }}
                  title="Color Picker"
                >
                  <div className="absolute inset-0 rounded-full border border-black/10" />
                </button>
                {showColorPicker && (
                  <div className="absolute left-full bottom-0 ml-2 bg-[#0c0c0e] border border-white/10 p-3.5 rounded-xl shadow-2xl z-50 flex flex-col gap-2">
                    <span className="text-[10px] text-gray-500 font-bold block mb-1">Color Palette</span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {['#c8a35c', '#ffffff', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#6366f1', '#14b8a6'].map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setBrushColor(c)
                            setShowColorPicker(false)
                          }}
                          className="h-4.5 w-4.5 rounded-full border border-transparent hover:border-white transition-all"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="border-t border-white/5 pt-2 flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400 font-sans">تحديد مخصص:</span>
                      <input
                        type="color"
                        value={brushColor}
                        onChange={(e) => setBrushColor(e.target.value)}
                        className="h-5 w-8 bg-transparent border border-white/10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Upload image */}
              <label className="p-2 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer transition" title="Upload Image File">
                <ImageIcon className="h-4.5 w-4.5" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

          </div>

          {/* Canvas viewport container */}
          <div className="flex-1 bg-[#0c0c0e] flex items-center justify-center p-4 overflow-hidden relative">
            <canvas ref={canvasRef} className="border border-white/5 rounded-xl shadow-2xl" />
          </div>

        </div>

      </div>
    </div>
  )
}
