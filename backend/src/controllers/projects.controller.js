const ProjectRequest = require('../models/ProjectRequest');
const fcmService = require('../services/fcm.service');
const { getIo } = require('../socket');

exports.createProjectRequest = async (req, res, next) => {
  try {
    const project = await ProjectRequest.create(req.body);

    const io = getIo();
    io.to('admin_room').emit('project:new', project);
    fcmService.notifyAdmins('New Project Request', `From ${project.clientName} for ${project.service}.`, { type: 'project', projectId: project._id.toString() });

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project request submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getProjectRequests = async (req, res, next) => {
  try {
    const projects = await ProjectRequest.find().sort('-createdAt');
    res.json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

exports.updateProjectStatus = async (req, res, next) => {
  try {
    const project = await ProjectRequest.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project request not found' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};
