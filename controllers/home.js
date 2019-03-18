const Task = require('../models/Task');

/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  res.render('home', {
    title: 'Home'
  });
};

// Get all solutions by user
exports.getDashboard = (req, res) => {
  Task.find({user: req.user.id})
  .then(tasks => {
    res.render('dashboard', {
      tasks: tasks,
      title: 'Dashboard'
    });
  })
};

