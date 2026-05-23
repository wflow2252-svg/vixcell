const axios = require('axios')

const META_GRAPH_URL = 'https://graph.facebook.com/v19.0'
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || 'dummy_token'
const PAGE_ID = process.env.META_PAGE_ID || 'dummy_page_id'
const IG_ACCOUNT_ID = process.env.META_IG_ACCOUNT_ID || 'dummy_ig_id'

exports.publishPost = async (text, imageUrl, platform = 'facebook') => {
  try {
    // For Facebook Page
    if (platform === 'facebook' || platform === 'both') {
      const fbPayload = {
        message: text,
        access_token: PAGE_ACCESS_TOKEN
      }
      if (imageUrl) {
        fbPayload.url = imageUrl
        await axios.post(`${META_GRAPH_URL}/${PAGE_ID}/photos`, fbPayload)
      } else {
        await axios.post(`${META_GRAPH_URL}/${PAGE_ID}/feed`, fbPayload)
      }
    }

    // For Instagram
    if (platform === 'instagram' || platform === 'both') {
      if (!imageUrl) {
        throw new Error('Instagram requires an image or video URL.')
      }
      // Step 1: Create media container
      const containerRes = await axios.post(`${META_GRAPH_URL}/${IG_ACCOUNT_ID}/media`, {
        image_url: imageUrl,
        caption: text,
        access_token: PAGE_ACCESS_TOKEN
      })
      
      const creationId = containerRes.data.id

      // Step 2: Publish container
      await axios.post(`${META_GRAPH_URL}/${IG_ACCOUNT_ID}/media_publish`, {
        creation_id: creationId,
        access_token: PAGE_ACCESS_TOKEN
      })
    }

    return true
  } catch (error) {
    console.error('Error publishing to Meta:', error.response?.data || error.message)
    return false
  }
}

exports.replyToComment = async (commentId, message) => {
  try {
    await axios.post(`${META_GRAPH_URL}/${commentId}/comments`, {
      message: message,
      access_token: PAGE_ACCESS_TOKEN
    })
    return true
  } catch (error) {
    console.error('Error replying to comment:', error.response?.data || error.message)
    return false
  }
}

// Boost a post (Requires Ad Account setup)
exports.boostPost = async (postId, budget, adAccountId) => {
  console.log(`[Marketing API] Boosting post ${postId} with budget ${budget} on account ${adAccountId}`)
  // This is a placeholder for the Meta Marketing API logic for creating ad campaigns
  // Requires extensive Ad account configurations (Campaign, AdSet, Ad Creatives)
  return true
}
