const DemoRequest = require('../models/DemoRequest');
const aiTemplateService = require('../services/aiTemplate.service');
const fcmService = require('../services/fcm.service');
const { getIo } = require('../socket');

exports.generateDemo = async (req, res, next) => {
  try {
    const { businessName, businessType, description, primaryColor, language, visitorEmail } = req.body;

    // Generate HTML using smart templates
    const generatedHtml = await aiTemplateService.generateWebsite({
      businessName,
      businessType,
      description,
      primaryColor,
      language
    });

    const demo = await DemoRequest.create({
      businessName,
      businessType,
      description,
      primaryColor,
      language,
      visitorEmail,
      generatedHtml,
      status: 'generated'
    });

    // Notify admins
    const io = getIo();
    io.to('admin_room').emit('demo:new', demo);
    fcmService.notifyAdmins('New AI Demo Generated', `A new demo for ${businessName} has been created.`, { type: 'demo', demoId: demo._id.toString() });

    res.status(201).json({
      success: true,
      data: {
        demoId: demo._id,
        htmlUrl: `/api/ai/demos/${demo._id}`,
        previewHtml: generatedHtml
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getDemos = async (req, res, next) => {
  try {
    const demos = await DemoRequest.find().sort('-createdAt').select('-generatedHtml');
    res.json({ success: true, data: demos });
  } catch (error) {
    next(error);
  }
};

exports.getDemoHtml = async (req, res, next) => {
  try {
    const demo = await DemoRequest.findById(req.params.id);
    if (!demo) {
      return res.status(404).send('Demo not found');
    }
    res.send(demo.generatedHtml);
  } catch (error) {
    next(error);
  }
};
