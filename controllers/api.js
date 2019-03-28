const WolframAlphaAPI = require('../lib/WolframAlphaAPI');
const Task = require('../models/Task');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
var Redis = require('ioredis');
var redis = new Redis(process.env.REDIS_URL,{connectTimeout: 10000});

// TODO
// 2. fetch img's from json then convert it to binary and save it in db instead url from wolfram
  // Another option - Integrate MathJax library for formating solutions
// 3. media query for resize img in solution
// 4. Delete all solutions
// 5. Redis integration
// 6. Deleting pdf after download or set expire
// 9. Sharing link with solution, for example button copy to clipboard
// 10. Add admin page (optional)

// Redis test route /redis
exports.testRedis = (req, res) => {

  async function main() {
    const shamu = {
        // type: 'killer whale',
        // age: 5,
        // lastFeedDate: 'Jan 06 2018',
        solution: 'name'
    };

    try {
        const key = 'shamu';
        const result = await redis.hmset(key, shamu);
        console.log(result);
        //HMGET myhash field1 field2 nofield (for multiple values)
        //HGET for single value

        //For retrive all values example
        // redisclient.hgetall(key, function (err, dbset) {

        //   // gather all records
        //   for (id in dbset) {
        //        ...
        //   }
        // }); 
        const rcache = await redis.hget('shamu', 'solution');
        console.log(rcache);
    }
    catch (error) {
        console.error(error);
    }
    //redis.disconnect();
}

main();
}
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
  const key = 
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
        const browser = await puppeteer.launch({args: ['--no-sandbox']});
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
        
        // var file = fs.createReadStream(fileName);
        // file.on('end', function() {
        //   fs.unlink(fileName, function() {
        //     // file deleted
        //   });
        // });
        // file.pipe(res);

      } catch (e) {
        console.log('our error', e);
      }
    })();
  });

};

// 1. Check in cache (if exists then redirect to solution)
//  1.1 Get hash with solution name as key and _id solution as value ex. 
//    (integrate e^x/(e^(2x)+2e^x+1): '5c9a7d6bb4fec20c10e716db')
//  1.2 Get necessary value (_id) from hash and using it as key for search solution from cache. 
// 2. Check in db (if exists then save it to cache and redirect)
//  2.1 Add to hash new key: value
// 3. Send request to WolframAlpha 
// 4. Save it to db
// 5. Save it to cache
//  5.1 Create hash (if not exists), then add key(taksName): value(_id)
//  5.2 Create solution record in Redis as key(id): value(solution)
// 6. Redirect to solution

// Find solution and save it
// integrate e^x/(e^(2x)+2e^x+1)
// exports.findSolution = (req, res) => {
//   const key = req.body.task;
//   const cachedSolution = JSON.parse(redis.get(key));
//   if (cachedSolution) {
//     console.log(`Exists in cache. Redirecting to solution ${cachedSolution.taskName}`);
//     res.redirect(`api/solution/${cachedSolution.id}`);
//   } else {
//     Task.findOne({
//       taskName: req.body.task
//     })
//     .then(solutionFromDB => {
//       if(solutionFromDB) {
//         const result = redis.set(solutionFromDB.taskName, JSON.stringify(solutionFromDB));
//         console.log(`Status Redis: ${result}. Exists in db. Saved to cache and redirecting to ${solutionFromDB.taskName}`);
//         res.redirect(`api/solution/${solutionFromDB.id}`);
//       }
//       else {
//         const waApi = WolframAlphaAPI(process.env.WOLFRAM_KEY);
//         const waTask = req.body.task;
//         waApi.getFull(waTask).then((queryresult) => {
//         const pods = queryresult.pods;
//         const newSolution = {
//           taskName: req.body.task,
//           contentData: pods,
//           user: req.user.id
//         }
//         // Save to db
//           new Task(newSolution)
//             .save()
//             console.log('New solution was added in db...')
//             .then(task => {
//               const cacheSolution = redis.set(task.taskName, JSON.stringify(task))
//               console.log(`Status Redis: ${cacheSolution}. Saved to cache and redirecting to ${task.taskName}`)
//               res.redirect(`api/solution/${task.id}`);
//             });
//       }).catch(console.error);
//       }
//     });
//   }
// };

exports.findSolution = (req, res, next) => {
  Task.findOne({
    taskName: req.body.task
  })
  .then(result => {
    if(result) {
      res.redirect(`api/solution/${result.id}`);
    }
    else {
      const waApi = WolframAlphaAPI(process.env.WOLFRAM_KEY);
      const waTask = req.body.task;
      waApi.getFull(waTask).then((queryresult) => {
      const pods = queryresult.pods;
      const newResult = {
        taskName: req.body.task,
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
    }
  })
};

// Delete task route = api/solutions/delete/:id
exports.deleteSolution = (req, res, next) => {
  Task.deleteOne({_id: req.params.id})
  .then(() => {
    req.flash('success', {msg: 'Solution was deleted'})
    res.redirect('/dashboard')
  });
};
