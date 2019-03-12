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

exports.getApi = (req, res) => {
  res.render('api/index', {
    title: 'Find Solution'
  });
};

exports.getWolframAlphaResult = (req, res) => {
  res.send('api/solution/show_id');
}; 

// integrate e^x/(e^(2x)+2e^x+1)
exports.postWolframAlpha = (req, res, next) => {
  const waApi = WolframAlphaAPI(process.env.WOLFRAM_KEY);
  // if(!req.body.task) {
  //   errors.push({text: 'Please enter a task'});
  // }
  // if(errors.length > 0){
  //   res.render('api/wolfram-alpha', {
  //     errors: errors,
  //     task: req.body.task
  //   });
  // } else {
    const waTask = req.body.task;
    waApi.getFull(waTask).then((queryresult) => {
    const pods = queryresult.pods;
    const taskResult = {
      taskName: req.body.task,
      contentData: pods,
      //userId: req.user.id
    }
    // For future use
    const output = pods.map((pod) => {
      const subpodContent = pod.subpods.map(subpod =>
        `  <img src="${subpod.img.src}" alt="${subpod.img.alt}">`
      ).join('\n');
      return `<h2>${pod.title}</h2>\n${subpodContent}`;}).join('\n');

    // Save to db
      new Task(taskResult)
        .save()
        .then(task => {
          res.send(output);
        })
    
  }).catch(console.error);
  }
 // }