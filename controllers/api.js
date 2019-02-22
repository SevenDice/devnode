const { promisify } = require('util');
const request = require('request');
const axios = require('axios');
const WolframAlphaAPI = require('../lib/WolframAlphaAPI');

const User = require('../models/User');
const Task = require('../models/Task');
/**
 * GET /api
 * List of API examples.
 */
exports.getApi = (req, res) => {
  res.render('api/index', {
    title: 'API Examples'
  });
};

/**
 * GET api/wolfram-alpha
 * Wolfram Alpha API.
 */

exports.getWolframAlpha = (req, res) => {
  res.render('api/wolfram-alpha', {
    title: 'WolframAPI'
  });
}; 

exports.getWolframAlphaResult = (req, res) => {
  res.render('api/wolfram-alpha-result', {
   // title: 'WolframAPI'
  });
}; 

/**
 * POST api/wolfram-alpha
 * Wolfram Alpha API.
 */

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