const WolframAlphaAPI = require('../lib/WolframAlphaAPI');
const Task = require('../models/Task');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL,{connectTimeout: 10000});
const hashName = 'solutionList';

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
    try {
        const allHash = await redis.hgetall('solutionList');

        function getKeyByValue(object, value) {
          return Object.keys(object).find(key => object[key] === value);
        }

        console.log(JSON.stringify(getKeyByValue(allHash,"5cc1ae86df32bc1cc4fdce0e")));
        redis.hdel(hashName, getKeyByValue(allHash,"5cc1ae86df32bc1cc4fdce0e"));
        res.redirect('/');
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

// Проверяем в кэше:
// - Ищем (redis.hexists(hashName, hashField)) в хэше('Solution list') id ('Value') решенной задачи по условию задачи ('Hash Field Name'), полученному из формы;
// - Если(hashFieldExists) найдено, то:
//   - Получаем (redis.hget(hashName, hashField)) id решенной задачи (cachedHashValue);
//   - Редирект res.redirect(`api/solution/${cachedHashValue._id}`);
// - Иначе:
//   - Проверяем в БД:
//     - Если найдено, то:
//       - Сохраняем в хэш поле(условие задачи): значение(id задачи) redis.hset(hashName, hashField, solution.id);
//       - Сохраняем в кэш ключ(id задачи): значение(решение задачи) redis.set(solution.id, );
//       - Редирект res.redirect(`api/solution/${solution._id}`);
//     - Иначе:
//       - Посылаем запрос к WolframAlphaAPI;
//       - Сохраняем в БД;
//       - Создаем хэш Solution List;
//       - Добавляем в хэш > условие задачи: id задачи;
//       - Добавлеяем строку (ключ: значение) в кэш > id задачи: решение задачи;
//       - Редирект res.redirect(`api/solution/${задача.id}`);

// Find solution and save it
// integrate e^x/(e^(2x)+2e^x+1)
exports.addSolution = (req, res) => {
  const hashField = req.body.task;
  async function findSolution() {
    try {
      const hashFieldExists = await redis.hexists(hashName, hashField);
      if(hashFieldExists) {
        const getHashValue = await redis.hget(hashName, hashField)
        res.redirect(`api/solution/${getHashValue}`);
      }
      else {
        Task.findOne({
          taskName: req.body.task
        })
        .then(solutionFromDB => {
          if (solutionFromDB) {
            redis.hset(hashName, hashField, solutionFromDB.id);
            redis.set(solutionFromDB.id, JSON.stringify(solutionFromDB));
            res.redirect(`api/solution/${solutionFromDB.id}`);
          }
          else {
            const waApi = WolframAlphaAPI(process.env.WOLFRAM_KEY);
            const waTask = req.body.task;
            waApi.getFull(waTask).then((queryresult) => {
            const pods = queryresult.pods;
            const newSolution = {
              taskName: req.body.task,
              contentData: pods,
              user: req.user.id
            }
            // Save to db
              new Task(newSolution)
                .save()
                .then(task => {
                  redis.hset(hashName, task.taskName, task.id);
                  redis.set(task.id, JSON.stringify(task))
                  res.redirect(`api/solution/${task.id}`);
                });
          })
          }
        })
      }
    }
    catch (error) {
    }
  }

(async () => {
  await findSolution();
})();
};



// // Find solution and save it (only db)
// // integrate e^x/(e^(2x)+2e^x+1)
// exports.findSolution = (req, res, next) => {
//   Task.findOne({
//     taskName: req.body.task
//   })
//   .then(result => {
//     if(result) {
//      res.redirect(`api/solution/${result.id}`);
//     //res.send(result);
//     }
//     else {
//       const waApi = WolframAlphaAPI(process.env.WOLFRAM_KEY);
//       const waTask = req.body.task;
//       waApi.getFull(waTask).then((queryresult) => {
//       const pods = queryresult.pods;
//       const newResult = {
//         taskName: req.body.task,
//         contentData: pods,
//         user: req.user.id
//       }
//       // Save to db
//         new Task(newResult)
//           .save()
//           .then(task => {
//            res.redirect(`api/solution/${task.id}`);
//         // res.send(task);
//           });
//     }).catch(console.error);
//     }
//   })
// };

// Delete task route = api/solutions/delete/:id
exports.deleteSolution = (req, res, next) => {
  async function eraseFromDBandCache(){
    try {
      const allHash = await redis.hgetall(hashName);

      function getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
      }
      const hashField = getKeyByValue(allHash, req.params.id);
      console.log(hashField);
      redis.del(req.params.id);
      redis.hdel(hashName, hashField);
      Task.deleteOne({_id: req.params.id})
      .then(() => {
        req.flash('success', {msg: 'Solution was deleted'})
        res.redirect('/dashboard')
      });
    }
    catch(error){

    }
  }

  (async () => {
    await eraseFromDBandCache();
  })();
};
