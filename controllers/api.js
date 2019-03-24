const WolframAlphaAPI = require('../lib/WolframAlphaAPI');
const Task = require('../models/Task');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

// TODO
// 2. 
// 3. media query for resize img in solution
// 4. Delete all solutions
// 5. Redis integration
// 6. Generate PDF with solution
// 9. Sharing link with solution, for example button copy to clipboard
// 10. Check if task already in db, then get it from db

// Get api index page
exports.getApi = (req, res) => {
  res.render('api/index', {
    title: 'Find Solution'
  });
};

// Get all solutions route = api/solutions
exports.getAllSolutions = (req, res) => {
  Task.find({})
  .populate('User')
  .sort({date:'desc'})
  .then(tasks => {
    res.render('api/solutions', {
      tasks: tasks,
      title: 'Solutions'
    });
  });
};

// Delete all solutions
exports.deleteAllSolutions = (req, res) => {
  Task.drop()
  res.render('api/solutions', {
    title: 'Solutions'
  });
};

// Show single solution route = solution/:id
exports.getSolution = (req, res) => {
  Task.findOne({
    _id: req.params.id
  })
  .populate('user')
  .then(task => {
    const output = task.contentData.map((pod) => {
      const subpodContent = pod.subpods.map(subpod =>
        `  <img src="${subpod.img.src}" alt="${subpod.img.alt}">`
      ).join('\n');
      return `<br>\n<h3>${pod.title}</h3>\n${subpodContent}`;}).join('\n');
    if(req.user){
      if(req.user.id == task.user._id){
        res.render('api/solution', {
          task:task,
          output:output,
          title: 'View Solution'
        });
      } else {
        res.redirect('/dashboard');
      }
  }}
  );
}; 

// Generate PDF single solution route = solution/pdf/:id
exports.getPDFSolution = (req, res) => {
  Task.findOne({
    _id: req.params.id
  })
  .then(task => {
    (async function(){
      try {

        const output = task.contentData.map((pod) => {
          const subpodContent = pod.subpods.map(subpod =>
            `  <img src="${subpod.img.src}" alt="${subpod.img.alt}">`
          ).join('\n');
          return `<br>\n<h3>${pod.title}</h3>\n${subpodContent}`;}).join('\n');

        const filePath = path.join(process.cwd(), 'generatedPDF', `${task.id}.pdf`)
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
  
        await page.setContent(output);
        await page.emulateMedia('screen');
        await page.pdf({
          path: filePath,
          format: 'A4',
          printBackground: true
        });
        const pdf = await (filePath);
        await browser.close();
        res.contentType('application/pdf'); 
        res.setHeader('Content-Disposition', 'attachment; filename=' + task.id +'.pdf');
        res.sendFile(pdf);
    
      } catch (e) {
        console.log('our error', e);
      }
    })();
  });

};

// Find solution and save it
// integrate e^x/(e^(2x)+2e^x+1)
exports.findSolution = (req, res, next) => {
  const waApi = WolframAlphaAPI(process.env.WOLFRAM_KEY);
    const waTask = req.body.task;
    waApi.getFull(waTask).then((queryresult) => {
    const pods = queryresult.pods;
    const newResult = {
      taskName: req.body.task,
      //taskCategory: pods.title,
      contentData: pods,
      user: req.user.id
    }
    // Save to db
      new Task(newResult)
        .save()
        .then(task => {
          res.redirect(`api/solution/${task.id}`);
        });
    
  }).catch(console.error);
};

// Delete task route = api/solutions/delete/:id
exports.deleteSolution = (req, res, next) => {
  Task.deleteOne({_id: req.params.id})
  .then(() => {
    req.flash('success', {msg: 'Solution was deleted'})
    res.redirect('/dashboard')
  });
};
