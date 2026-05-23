import { put } from '@vercel/blob'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const chunks = []
    for await (const chunk of req) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    const contentType = req.headers['content-type'] || 'image/png'
    const filename = req.headers['x-filename'] || `logo-${Date.now()}.png`

    const blob = await put(`logos/${filename}`, buffer, {
      access: 'public',
      contentType,
    })

    return res.status(200).json({ url: blob.url })
  } catch (err) {
    console.error('Upload error:', err)
    return res.status(500).json({ error: err.message })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
