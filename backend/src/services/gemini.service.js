const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key')

exports.generateB2BPost = async (trend) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
    const prompt = `
      أنت وكيل تسويق ذكاء اصطناعي لشركة Vixcell، وهي وكالة برمجيات متخصصة في تطوير الأنظمة (ERP, SaaS, Mobile Apps) وحلول الذكاء الاصطناعي للشركات (B2B).
      اكتب منشوراً تسويقياً احترافياً باللغة العربية (بأسلوب شركات، جذاب وموجه للمديرين وأصحاب الأعمال) بناءً على هذا التريند التقني:
      "${trend}"
      
      شروط:
      - لا تتعدى 150 كلمة.
      - اشرح كيف يمكن لـ Vixcell حل مشاكل الشركات باستخدام هذه التقنية.
      - أضف هاشتاجات مناسبة.
      - تجنب الأسلوب التسويقي الرخيص، استخدم نبرة استشارية تقنية.
    `
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error generating B2B post with Gemini:', error)
    return null
  }
}

exports.analyzeCommentAndReply = async (commentText) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
    const prompt = `
      أنت مساعد ذكي لخدمة العملاء في شركة Vixcell للبرمجيات.
      تلقينا هذا التعليق/الرسالة من عميل محتمل على السوشيال ميديا:
      "${commentText}"
      
      قم بتحليل التعليق وأرجع ردك بصيغة JSON فقط تحتوي على:
      1. "reply": الرد المناسب باللغة العربية المصرية الاحترافية (ودود ومناسب للـ B2B).
      2. "isLead": true إذا كان العميل يطلب تفاصيل عن الأسعار أو يريد تنفيذ مشروع، false إذا كان تعليقاً عادياً أو شكر.
      3. "service": نوع الخدمة التي يهتم بها (مثال: ERP, Mobile App, Web, AI) إن وجدت.
      4. "needsHuman": true إذا كان السؤال تقنياً معقداً جداً ويحتاج لمهندس أو فريق المبيعات للرد.

      إذا كان isLead = true، اطلب في الرد بلطف رقم هاتفه أو بريده الإلكتروني للتواصل معه لتحديد موعد استشارة مجانية.
      يجب أن يكون الناتج JSON فقط بدون أي نصوص إضافية أو Markdown formatting.
    `
    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(text)
  } catch (error) {
    console.error('Error analyzing comment with Gemini:', error)
    return { reply: 'شكراً لتواصلك معنا! سنتواصل معك قريباً.', isLead: false, needsHuman: true }
  }
}
