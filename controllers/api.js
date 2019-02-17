const { promisify } = require('util');
const request = require('request');
const cheerio = require('cheerio');
const graph = require('fbgraph');
const GitHub = require('@octokit/rest');
const Twit = require('twit');
const Linkedin = require('node-linkedin')(process.env.LINKEDIN_ID, process.env.LINKEDIN_SECRET, process.env.LINKEDIN_CALLBACK_URL);
const axios = require('axios');
const WolframAlphaAPI = require('../lib/WolframAlphaAPI');

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

/**
 * POST api/wolfram-alpha
 * Wolfram Alpha API.
 */

// integrate e^x/(e^(2x)+2e^x+1)
exports.postWolframAlpha = (req, res, next) => {
const waApi = WolframAlphaAPI(process.env.WOLFRAM_KEY);
const waTask = req.body.task;
waApi.getFull(waTask).then((queryresult) => {
	const pods = queryresult.pods;
	//console.log(pods);
  const output = pods.map((pod) => {
    const subpodContent = pod.subpods.map(subpod =>
      `  <img src="${subpod.img.src}" alt="${subpod.img.alt}">`
    ).join('\n');
    return `<h2>${pod.title}</h2>\n${subpodContent}`;
  }).join('\n');
  //console.log(output);
  const taskResult = output;
  res.send(taskResult);
  //res.redirect('/api/wolfram-alpha')
}).catch(console.error);
}

/**
 * GET /api/facebook
 * Facebook API example.
 */
exports.getFacebook = (req, res, next) => {
  const token = req.user.tokens.find(token => token.kind === 'facebook');
  graph.setAccessToken(token.accessToken);
  graph.get(`${req.user.facebook}?fields=id,name,email,first_name,last_name,gender,link,locale,timezone`, (err, profile) => {
    if (err) { return next(err); }
    res.render('api/facebook', {
      title: 'Facebook API',
      profile
    });
  });
};

/**
 * GET /api/scraping
 * Web scraping example using Cheerio library.
 */
exports.getScraping = (req, res, next) => {
  request.get('https://news.ycombinator.com/', (err, request, body) => {
    if (err) { return next(err); }
    const $ = cheerio.load(body);
    const links = [];
    $('.title a[href^="http"], a[href^="https"]').slice(1).each((index, element) => {
      links.push($(element));
    });
    res.render('api/scraping', {
      title: 'Web Scraping',
      links
    });
  });
};

/**
 * GET /api/github
 * GitHub API Example.
 */
exports.getGithub = async (req, res, next) => {
  const github = new GitHub();
  try {
    const { data: repo } = await github.repos.get({ owner: 'sahat', repo: 'hackathon-starter' });
    res.render('api/github', {
      title: 'GitHub API',
      repo
    });
  } catch (error) {
    next(error);
  }
};



/**
 * GET /api/twitter
 * Twitter API example.
 */
exports.getTwitter = async (req, res, next) => {
  const token = req.user.tokens.find(token => token.kind === 'twitter');
  const T = new Twit({
    consumer_key: process.env.TWITTER_KEY,
    consumer_secret: process.env.TWITTER_SECRET,
    access_token: token.accessToken,
    access_token_secret: token.tokenSecret
  });
  try {
    const { data: { statuses: tweets } } = await T.get('search/tweets', {
      q: 'nodejs since:2013-01-01',
      geocode: '40.71448,-74.00598,5mi',
      count: 10
    });
    res.render('api/twitter', {
      title: 'Twitter API',
      tweets
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/twitter
 * Post a tweet.
 */
exports.postTwitter = (req, res, next) => {
  req.assert('tweet', 'Tweet cannot be empty').notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/api/twitter');
  }

  const token = req.user.tokens.find(token => token.kind === 'twitter');
  const T = new Twit({
    consumer_key: process.env.TWITTER_KEY,
    consumer_secret: process.env.TWITTER_SECRET,
    access_token: token.accessToken,
    access_token_secret: token.tokenSecret
  });
  T.post('statuses/update', { status: req.body.tweet }, (err) => {
    if (err) { return next(err); }
    req.flash('success', { msg: 'Your tweet has been posted.' });
    res.redirect('/api/twitter');
  });
};

/**
 * GET /api/linkedin
 * LinkedIn API example.
 */
exports.getLinkedin = (req, res, next) => {
  const token = req.user.tokens.find(token => token.kind === 'linkedin');
  const linkedin = Linkedin.init(token.accessToken);
  linkedin.people.me((err, $in) => {
    if (err) { return next(err); }
    res.render('api/linkedin', {
      title: 'LinkedIn API',
      profile: $in
    });
  });
};

/**
 * GET /api/upload
 * File Upload API example.
 */

exports.getFileUpload = (req, res) => {
  res.render('api/upload', {
    title: 'File Upload'
  });
};

exports.postFileUpload = (req, res) => {
  req.flash('success', { msg: 'File was uploaded successfully.' });
  res.redirect('/api/upload');
};