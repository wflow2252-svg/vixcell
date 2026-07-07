import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, name, email, avatar, provider } = body

    // Log the attendance details
    console.log(`[ATTENDANCE LOG] User: ${name} (${email}) joined room ${code} via ${provider}.`)

    // Save user info and meeting attendance inside the database system
    // In production, this can perform a prisma db save or supabase table insert:
    // await prisma.meetingAttendance.create({ data: { roomCode: code, name, email, avatar, provider } })

    return NextResponse.json({
      success: true,
      message: 'Attendance logged successfully',
      data: { code, name, email, timestamp: new Date().toISOString() }
    })
  } catch (error: any) {
    console.error('Save attendance endpoint error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
