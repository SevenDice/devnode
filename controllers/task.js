const { promisify } = require('util');
const request = require('request');
const axios = require('axios');
const WolframAlphaAPI = require('../lib/WolframAlphaAPI');

const User = require('../models/User');
const Task = require('../models/Task');

//GET /task
exports.getTask = (req, res) => {
  res.render('./../views/tasks/task')

}