const cron = require('node-cron')
const geminiService = require('../services/gemini.service')
const metaGraphService = require('../services/metaGraph.service')
const mediaGenService = require('../services/mediaGen.service')
const SocialPost = require('../models/SocialPost')

// Run every day at 10:00 AM
const startDailyMarketingCron = () => {
  cron.schedule('0 10 * * *', async () => {
    console.log('[CRON] Starting Daily B2B Marketing Agent...')
    try {
      // 1. Tech trend to focus on today
      const trends = ['الذكاء الاصطناعي التوليدي', 'أتمتة الشركات', 'أنظمة الـ ERP السحابية', 'تطبيقات الموبايل للتجارة الإلكترونية']
      const todayTrend = trends[Math.floor(Math.random() * trends.length)]
      
      // 2. Generate Content via Gemini
      const postText = await geminiService.generateB2BPost(todayTrend)
      if (!postText) throw new Error('Failed to generate post text')

      // 3. Generate Visual
      const visualPrompt = `Professional 3D isometric illustration of ${todayTrend} concept, digital agency style, dark theme with electric violet accents`
      const mediaUrl = await mediaGenService.generateTechVisual(visualPrompt)

      // 4. Publish to Meta
      const published = await metaGraphService.publishPost(postText, mediaUrl, 'both')
      
      if (published) {
        // 5. Save to DB
        await SocialPost.create({
          platform: 'both',
          contentType: 'tech_trend',
          text: postText,
          mediaUrl: mediaUrl,
          publishedAt: new Date()
        })
        console.log('[CRON] Successfully published daily post to Meta.')
      }
    } catch (error) {
      console.error('[CRON] Error in daily marketing task:', error)
    }
  })
}

module.exports = startDailyMarketingCron
