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
  Maximize2, 
  Image as ImageIcon, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  MousePointer
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
  const [canvas, setCanvas] = useState<any>(null)
  const [activeTool, setActiveTool] = useState<'select' | 'pen' | 'eraser' | 'text' | 'sticky' | 'rect' | 'circle' | 'arrow'>('select')
  const [brushColor, setBrushColor] = useState('#c8a35c')
  const [brushSize, setBrushSize] = useState(4)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(3)
  const [zoomLevel, setZoomLevel] = useState(100)

  // Real-time channel for whiteboard syncing
  const channelRef = useRef<any>(null)

  // Initialize Fabric.js Canvas
  useEffect(() => {
    if (typeof window === 'undefined' || !canvasRef.current) return

    // Import fabric dynamically to avoid SSR errors
    const initFabric = async () => {
      const fabricModule = await import('fabric')
      const fabric = fabricModule.fabric
      window.fabric = fabric

      const newCanvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 500,
        backgroundColor: '#0c0c0e',
        isDrawingMode: false
      })

      // Set grid guide background
      newCanvas.on('after:render', () => {
        const ctx = newCanvas.getContext()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)'
        ctx.lineWidth = 1
        const gridSize = 30
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

      setCanvas(newCanvas)

      // Broadcast changes to other devices via Supabase Realtime
      newCanvas.on('object:added', (e: any) => {
        if (e.target?.fromSync) return // Don't re-broadcast synced objects
        broadcastCanvasChange({
          type: 'added',
          object: e.target.toObject()
        })
      })

      newCanvas.on('object:modified', (e: any) => {
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
    const channelName = `whiteboard:${meetingId}`
    channelRef.current = supabase.channel(channelName)

    channelRef.current
      .on('broadcast', { event: 'draw' }, ({ payload }: any) => {
        if (!canvas) return
        
        // Handle incoming canvas objects from other devices
        const { type, object, id, left, top, scaleX, scaleY, angle } = payload
        
        if (type === 'added') {
          // Import object using Fabric.js
          window.fabric?.util.enlivenObjects([object], (enlivened: any[]) => {
            enlivened.forEach((obj) => {
              obj.fromSync = true
              obj.id = object.id || Math.random().toString()
              canvas.add(obj)
              canvas.requestRenderAll()
            })
          })
        } else if (type === 'modified') {
          // Find object by ID and modify coordinates
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
  }, [canvas, meetingId])

  const broadcastCanvasChange = (payload: any) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'draw',
        payload
      })
    }
  }

  // Handle Tool Changes
  useEffect(() => {
    if (!canvas) return
    canvas.isDrawingMode = activeTool === 'pen'

    if (activeTool === 'pen') {
      canvas.freeDrawingBrush.color = brushColor
      canvas.freeDrawingBrush.width = brushSize
    } else if (activeTool === 'eraser') {
      canvas.isDrawingMode = true
      canvas.freeDrawingBrush.color = '#0c0c0e' // Match background
      canvas.freeDrawingBrush.width = 25
    }
  }, [activeTool, brushColor, brushSize, canvas])

  // Shapes & Text Tools
  const addRect = () => {
    if (!canvas) return
    const rect = new window.fabric.Rect({
      left: 150,
      top: 150,
      fill: 'transparent',
      stroke: brushColor,
      strokeWidth: brushSize,
      width: 100,
      height: 100,
      id: Math.random().toString()
    })
    canvas.add(rect)
    canvas.setActiveObject(rect)
    setActiveTool('select')
  }

  const addCircle = () => {
    if (!canvas) return
    const circle = new window.fabric.Circle({
      left: 150,
      top: 150,
      fill: 'transparent',
      stroke: brushColor,
      strokeWidth: brushSize,
      radius: 50,
      id: Math.random().toString()
    })
    canvas.add(circle)
    canvas.setActiveObject(circle)
    setActiveTool('select')
  }

  const addArrow = () => {
    if (!canvas) return
    // Simple line with arrow head mockup in fabric.js
    const line = new window.fabric.Line([50, 50, 200, 50], {
      stroke: brushColor,
      strokeWidth: brushSize + 2,
      id: Math.random().toString()
    })
    canvas.add(line)
    canvas.setActiveObject(line)
    setActiveTool('select')
  }

  const addText = () => {
    if (!canvas) return
    const text = new window.fabric.IText('اكتب هنا...', {
      left: 150,
      top: 150,
      fill: brushColor,
      fontSize: 24,
      fontFamily: 'Inter',
      id: Math.random().toString()
    })
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.enterEditingWithActiveObject()
    setActiveTool('select')
  }

  const addStickyNote = (color: 'yellow' | 'blue' | 'green') => {
    if (!canvas) return
    const fill = color === 'yellow' ? '#fef08a' : color === 'blue' ? '#bfdbfe' : '#bbf7d0'
    const textColor = '#1e293b'

    const rect = new window.fabric.Rect({
      fill: fill,
      width: 150,
      height: 150,
      rx: 6,
      ry: 6,
      shadow: '0 4px 6px rgba(0,0,0,0.1)'
    })

    const text = new window.fabric.IText('ملاحظة...', {
      fontSize: 16,
      fill: textColor,
      fontFamily: 'Inter',
      left: 15,
      top: 15,
      width: 120
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

  const handleClear = () => {
    if (!canvas) return
    canvas.clear()
    canvas.setBackgroundColor('#0c0c0e')
    canvas.requestRenderAll()
    broadcastCanvasChange({ type: 'clear' })
  }

  // Zoom Controllers
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (!canvas) return
    let zoom = canvas.getZoom()
    if (direction === 'in') zoom += 0.1
    else if (direction === 'out') zoom -= 0.1
    else zoom = 1

    canvas.setZoom(zoom)
    setZoomLevel(Math.round(zoom * 100))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    const reader = new FileReader()

    reader.onload = (f) => {
      const data = f.target?.result
      window.fabric.Image.fromURL(data as string, (img) => {
        img.set({
          left: 100,
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

  // Mock PDF Uploader
  const handlePdfUpload = () => {
    if (!canvas) return
    // Places a beautiful mock wireframe/schematic layout simulating PDF page extraction
    const pdfRect = new window.fabric.Rect({
      left: 100,
      top: 50,
      width: 320,
      height: 400,
      fill: '#ffffff',
      rx: 8,
      ry: 8,
      shadow: '0 8px 16px rgba(0,0,0,0.2)'
    })

    const pdfTitle = new window.fabric.Text('مخطط الصفحة الرئيسية.pdf', {
      left: 120,
      top: 70,
      fontSize: 16,
      fill: '#0f172a',
      fontFamily: 'Inter',
      fontWeight: 'bold'
    })

    const pdfBody = new window.fabric.Rect({
      left: 120,
      top: 100,
      width: 280,
      height: 320,
      fill: 'transparent',
      stroke: '#cbd5e1',
      strokeWidth: 2
    })

    const group = new window.fabric.Group([pdfRect, pdfTitle, pdfBody], {
      left: 100,
      top: 50,
      id: Math.random().toString()
    })

    canvas.add(group)
    canvas.setActiveObject(group)
  }

  return (
    <div className="flex flex-col bg-[#0a0a0d] border border-white/5 rounded-2xl overflow-hidden h-full">
      {/* Top Whiteboard Bar */}
      <div className="bg-[#0c0c0e] border-b border-white/5 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Active device role warning indicator */}
          {deviceRole === 'whiteboard' ? (
            <span className="text-xs bg-blue-600/10 text-blue-400 border border-blue-600/20 px-2 py-0.5 rounded-full animate-pulse">
              وضع تابلت الرسم الفعال (Stealth Canvas Active)
            </span>
          ) : (
            <span className="text-xs text-[#c8a35c] font-semibold">لوحة النقاش المشتركة (Whiteboard)</span>
          )}
        </div>

        {/* Multi page navigator */}
        <div className="flex items-center gap-2 bg-[#0a0a0d] px-3 py-1 rounded-lg border border-white/5 text-xs font-mono">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
            className="text-gray-400 hover:text-white disabled:opacity-30 transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-white">الصفحة {currentPage} / {totalPages}</span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
            className="text-gray-400 hover:text-white disabled:opacity-30 transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Zoom details */}
        <div className="flex items-center gap-2">
          <button onClick={() => handleZoom('out')} className="text-gray-400 hover:text-white p-1" title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-500 font-mono w-10 text-center">{zoomLevel}%</span>
          <button onClick={() => handleZoom('in')} className="text-gray-400 hover:text-white p-1" title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={() => handleZoom('reset')} className="text-xs text-gray-400 hover:text-white bg-white/5 px-2 py-0.5 rounded border border-white/5 ml-1">
            إعادة تعيين
          </button>
        </div>
      </div>

      {/* Main Canvas + Left Sidebar tools */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left whiteboard toolbar */}
        <div className="w-16 bg-[#0c0c0e] border-r border-white/5 flex flex-col items-center py-4 justify-between">
          <div className="space-y-3.5 flex flex-col items-center">
            {/* Pointer select tool */}
            <button
              onClick={() => setActiveTool('select')}
              className={`p-2.5 rounded-xl transition-all ${
                activeTool === 'select' ? 'bg-[#c8a35c] text-[#0c0c0e]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              title="Select / Move"
            >
              <MousePointer className="h-4.5 w-4.5" />
            </button>

            {/* Free draw Pen */}
            <button
              onClick={() => setActiveTool('pen')}
              className={`p-2.5 rounded-xl transition-all ${
                activeTool === 'pen' ? 'bg-[#c8a35c] text-[#0c0c0e]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              title="Draw Brush"
            >
              <Edit3 className="h-4.5 w-4.5" />
            </button>

            {/* Eraser */}
            <button
              onClick={() => setActiveTool('eraser')}
              className={`p-2.5 rounded-xl transition-all ${
                activeTool === 'eraser' ? 'bg-[#c8a35c] text-[#0c0c0e]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              title="Eraser"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>

            {/* Text tool */}
            <button
              onClick={addText}
              className="p-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
              title="Add Text"
            >
              <Type className="h-4.5 w-4.5" />
            </button>

            {/* Sticky Notes */}
            <div className="relative group">
              <button
                className="p-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                title="Sticky Notes"
              >
                <StickyNote className="h-4.5 w-4.5" />
              </button>
              {/* Dropdown sticky selector */}
              <div className="absolute left-full top-0 ml-2 bg-[#0c0c0e] border border-white/5 rounded-lg p-2.5 hidden group-hover:flex flex-col gap-2.5 shadow-2xl z-50">
                <button onClick={() => addStickyNote('yellow')} className="h-6 w-6 rounded bg-yellow-200 border border-yellow-300" title="Yellow Note" />
                <button onClick={() => addStickyNote('blue')} className="h-6 w-6 rounded bg-blue-200 border border-blue-300" title="Blue Note" />
                <button onClick={() => addStickyNote('green')} className="h-6 w-6 rounded bg-green-200 border border-green-300" title="Green Note" />
              </div>
            </div>

            {/* Shapes */}
            <div className="relative group">
              <button
                className="p-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                title="Insert Shape"
              >
                <Square className="h-4.5 w-4.5" />
              </button>
              {/* Shapes drawer */}
              <div className="absolute left-full top-0 ml-2 bg-[#0c0c0e] border border-white/5 rounded-lg p-2 hidden group-hover:flex gap-2 shadow-2xl z-50">
                <button onClick={addRect} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded"><Square className="h-4 w-4" /></button>
                <button onClick={addCircle} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded"><Circle className="h-4 w-4" /></button>
                <button onClick={addArrow} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded"><TrendingUp className="h-4 w-4" /></button>
              </div>
            </div>

            {/* Image & PDF insertions */}
            <label className="p-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer transition-all" title="Upload Image">
              <ImageIcon className="h-4.5 w-4.5" />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>

            <button onClick={handlePdfUpload} className="p-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all" title="Insert PDF Layout">
              <FileText className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Color & Clear tool */}
          <div className="space-y-4 flex flex-col items-center">
            {/* Color indicator selector */}
            <div className="flex flex-col gap-1.5">
              {['#c8a35c', '#ffffff', '#ef4444', '#3b82f6', '#10b981'].map((c) => (
                <button
                  key={c}
                  onClick={() => setBrushColor(c)}
                  className={`h-4.5 w-4.5 rounded-full border ${
                    brushColor === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <button
              onClick={handleClear}
              className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition"
              title="Clear Canvas"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Canvas viewport container */}
        <div className="flex-1 bg-[#0c0c0e] flex items-center justify-center p-4 overflow-hidden relative">
          <canvas ref={canvasRef} className="border border-white/5 rounded-xl shadow-2xl" />
        </div>
      </div>
    </div>
  )
}
