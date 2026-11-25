const mongoose = require('mongoose');
const { deleteResumeCascade } = require('../services/cascadeService');
const AppError = require('../utils/AppError');

const getUserId = (req) => req.user?._id || req.user?.id;

const deleteResume = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) throw new AppError('Pehle login karein', 401, 'UNAUTHORIZED');

  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new AppError('Resume id galat hai', 400, 'VALIDATION_ERROR');
  }

  const removed = await deleteResumeCascade(userId, req.params.id);
  if (!removed) throw new AppError('Resume nahi mila', 404, 'NOT_FOUND');

  res.status(200).json({ success: true, message: 'Resume aur us se jura sara data delete ho gaya', removed });
};

module.exports = { deleteResume };