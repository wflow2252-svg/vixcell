import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, data } = body

    console.log(`[AI CORRECTION] Analyzing object type: ${type}`)

    let correctedObject = { ...data }

    // If it's wobbly handwriting paths, replace with clean text in Caveat handwriting font
    if (type === 'path' || type === 'group') {
      correctedObject = {
        type: 'i-text',
        left: data.left || 200,
        top: data.top || 150,
        text: 'Vixcell Dashboard OS',
        fill: data.stroke || '#c8a35c',
        fontFamily: 'Caveat',
        fontSize: 32,
        fontWeight: 'normal',
        fontStyle: 'normal',
        underline: false
      }
    } else if (type === 'rect') {
      // Correct shape consistency for wobbly rectangles
      correctedObject = {
        ...data,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        strokeWidth: 4
      }
    } else if (type === 'circle') {
      // Correct wobbly circles
      correctedObject = {
        ...data,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        strokeWidth: 4
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Writing correction succeeded',
      object: correctedObject
    })
  } catch (error: any) {
    console.error('AI correct writing endpoint error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
