const { promisify } = require('util');
const request = require('request');
const axios = require('axios');
const WolframAlphaAPI = require('../lib/WolframAlphaAPI');

const User = require('../models/User');
const Task = require('../models/Task');

// TODO
// 1. Get list of all solved tasks by User
// 2. View single solution
// 3. Delete single solution
// 4. Delete all solutions
// 5. Redis integration
// 6. Generate PDF with solution
// 7. Get list of all solved tasks by all users (optional)
// 8. Dividing solutions by category ex. like integral (optional)
// 9. Sharing link with solution, for example button copy to clipboard

// TODO 
// include all routes in app.js

exports.getApi = (req, res) => {
  res.render('api/index', {
    title: 'Find Solution'
  });
};

// Get all solutions route = api/solutions
exports.getAllSolutions = (req, res) => {
  Task.find({})
  .populate('user')
  .sort({date:'desc'})
  .then(tasks => {
    res.render('api/solutions'), { // TODO Pug template
      tasks: tasks
    }
  })
}

// Show single solution route = solution/:id
exports.getSolution = (req, res) => {
  Task.findOne({
    _id: req.params.id
  })
  .populate('user')
  .then(task => {
    if(req.user){
      if(req.user.id == task.user._id){
        res.render('api/solution', {
          task:task
        });
      } else {
        res.redirect('/dashboard');
      }
  };
}); 

// Find solution and save it
// integrate e^x/(e^(2x)+2e^x+1)
exports.findSolution = (req, res, next) => {
  const waApi = WolframAlphaAPI(process.env.WOLFRAM_KEY);
    const waTask = req.body.task;
    waApi.getFull(waTask).then((queryresult) => {
    const pods = queryresult.pods;
    const newResult = {
      taskName: req.body.task,
      taskCategory: pods.title[1],
      contentData: pods,
      user: req.user.id
    }
    // For future use
    const output = pods.map((pod) => {
      const subpodContent = pod.subpods.map(subpod =>
        `  <img src="${subpod.img.src}" alt="${subpod.img.alt}">`
      ).join('\n');
      return `<h2>${pod.title}</h2>\n${subpodContent}`;}).join('\n');

    // Save to db
      new Task(newResult)
        .save()
        .then(task => {
          res.redirect(`api/solution/${task.id}`);
        })
    
  }).catch(console.error);
  }}

// Delete task route = api/solution/:id
exports.deleteTask = (req, res) => {
  Task.remove({_id: req.params.id})
  .then(() => {
    res.redirect('/dashboard')
  })
}
