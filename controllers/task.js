const Task = require('../models/Task');
const { promisify } = require('util');
const request = require('request');
const axios = require('axios');
const WolframAlphaAPI = require('../lib/WolframAlphaAPI');

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
    title: 'WolframAPI'
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

    const output = pods.map((pod) => {
      const subpodContent = pod.subpods.map(subpod =>
        `  <img src="${subpod.img.src}" alt="${subpod.img.alt}">`
      ).join('\n');
      return `<h2>${pod.title}</h2>\n${subpodContent}`;}).join('\n');
    const taskResult = {
      taskName: req.body.task,
      contentData: output
    }
    res.send(taskResult);
    //res.redirect('/api/wolfram-alpha')
  }).catch(console.error);
  }
 // }