const geminiService = require('../services/gemini.service')
const metaGraphService = require('../services/metaGraph.service')
const Lead = require('../models/Lead')

exports.verifyWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'vixcell_secure_token_2026'
  
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']
    
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED')
      res.status(200).send(challenge)
    } else {
      res.sendStatus(403)
    }
  } else {
    res.sendStatus(400)
  }
}

exports.handleWebhook = async (req, res) => {
  const body = req.body

  if (body.object === 'page' || body.object === 'instagram') {
    res.status(200).send('EVENT_RECEIVED') // Acknowledge Meta immediately

    for (const entry of body.entry) {
      // Handle Comments
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.value && change.value.item === 'comment' && change.value.verb === 'add') {
            const commentId = change.value.comment_id
            const message = change.value.message
            const senderId = change.value.from.id
            const senderName = change.value.from.name

            // Ignore our own comments
            if (senderId === process.env.META_PAGE_ID) continue

            console.log(`New comment from ${senderName}: ${message}`)
            
            // Analyze with Gemini
            const analysis = await geminiService.analyzeCommentAndReply(message)
            
            // Send reply
            if (analysis.reply) {
              await metaGraphService.replyToComment(commentId, analysis.reply)
            }

            // Capture Lead if applicable
            if (analysis.isLead) {
              await Lead.create({
                name: senderName,
                source: body.object === 'instagram' ? 'instagram' : 'facebook',
                aiSummary: `Comment: ${message}\nInterested in: ${analysis.service || 'Unknown'}`,
                metaCommentId: commentId,
                metaSenderId: senderId,
                serviceInterestedIn: analysis.service,
                status: analysis.needsHuman ? 'new' : 'contacted'
              })
              
              if (analysis.needsHuman) {
                // TODO: Send internal notification to Sales team (via FCM or Slack)
                console.log(`[ALERT] High-value lead requires human attention: ${senderName}`)
              }
            }
          }
        }
      }
      
      // Handle DMs (Messaging)
      if (entry.messaging) {
        // Similar logic for DMs using entry.messaging array
      }
    }
  } else {
    res.sendStatus(404)
  }
}
