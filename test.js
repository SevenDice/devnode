const dotenv = require('dotenv');
//some changes for test git
dotenv.load({ path: '.env.example' });

const WolframAlphaAPI = require('./lib/WolframAlphaAPI');
const waApi = WolframAlphaAPI(process.env.WOLFRAM_KEY);

waApi.getFull('integrate e^x/(e^(2x)+2e^x+1)').then((queryresult) => {
  const pods = queryresult.pods;
  const output = {
    taskName: 'integrate e^x/(e^(2x)+2e^x+1)',
    imgTaskData: pods.img.src,
    textTaskData: pods.img.alt,
    titleTaskData: pods.title
    //userId: req.user.id
  }
  return output;

  console.log(output);
  
}).catch(console.error);

// Source example
// const WolframAlphaAPI = require('./lib/WolframAlphaAPI');
// const waApi = WolframAlphaAPI('7PAJ6H-8V75JGYVVR');

// waApi.getFull('integrate e^x/(e^(2x)+2e^x+1)').then((queryresult) => {
//   const pods = queryresult.pods;
//   const output = pods.map((pod) => {
//     const subpodContent = pod.subpods.map(subpod =>
//       `  <img src="${subpod.img.src}" alt="${subpod.img.alt}">`
//     ).join('\n');
//     return `<h2>${pod.title}</h2>\n${subpodContent}`;
//   }).join('\n');
//   console.log(output);
// }).catch(console.error);

exports.findSolution = (req, res) => {
  const key = req.body.task;
  const cachedSolution = JSON.parse(redis.get(key));
  if (cachedSolution) {
    console.log(`Exists in cache. Redirecting to solution ${cachedSolution.taskName}`);
    res.redirect(`api/solution/${cachedSolution.id}`);
  } else {
    Task.findOne({
      taskName: req.body.task
    })
    .then(solutionFromDB => {
      if(solutionFromDB) {
        const result = redis.set(solutionFromDB.taskName, JSON.stringify(solutionFromDB));
        console.log(`Status Redis: ${result}. Exists in db. Saved to cache and redirecting to ${solutionFromDB.taskName}`);
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
            console.log('New solution was added in db...')
            .then(task => {
              const cacheSolution = redis.set(task.taskName, JSON.stringify(task))
              console.log(`Status Redis: ${cacheSolution}. Saved to cache and redirecting to ${task.taskName}`)
              res.redirect(`api/solution/${task.id}`);
            });
      }).catch(console.error);
      }
    });
  }
};


// Promise Example 
/* ES5, using Bluebird */
var isMomHappy = true;

// Promise
var willIGetNewPhone = new Promise(
    function (resolve, reject) {
        if (isMomHappy) {
            var phone = {
                brand: 'Samsung',
                color: 'black'
            };
            resolve(phone);
        } else {
            var reason = new Error('mom is not happy');
            reject(reason);
        }

    }
);


// call our promise
var askMom = function () {
    willIGetNewPhone
        .then(function (fulfilled) {
            // yay, you got a new phone
            console.log(fulfilled);
        })
        .catch(function (error) {
            // ops, mom don't buy it
            console.log(error.message);
        });
}

askMom();

// 2й промис

var showOff = function (phone) {

  var message = 'Hey friend, I have a new ' +
  
    phone.color + ' ' + phone.brand + ' phone';
  
  return Promise.resolve(message);
  
  };

  // Вызываем промис
var askMom = function () {
  willIGetNewPhone
  .then(showOff) // связываем
  .then(function (fulfilled) {
          console.log(fulfilled);
       // output: 'Hey friend, I have a new black Samsung phone.'
      })
      .catch(function (error) {
          // oops, mom don't buy it
          console.log(error.message);
       // output: 'mom is not happy'
      });
};
var askMom = function () {
  console.log('before asking Mom'); // Выводим в консоль до
  willIGetNewPhone
      .then(showOff)
      .then(function (fulfilled) {
          console.log(fulfilled);
      })
      .catch(function (error) {
          console.log(error.message);
      });
  console.log('after asking mom'); // Выводим в консоль после
}
// 1. before asking Mom

// 2. after asking mom

// 3. Hey friend, I have a new black Samsung phone.

//Все что должно подождать промиса перед выполнением, вы вставляете в .then .

// /_ ES6 _/
const isMomHappy = true;

// Промис
const willIGetNewPhone = new Promise(
    (resolve, reject) => { // fat arrow
        if (isMomHappy) {
            const phone = {
                brand: 'Samsung',
                color: 'black'
            };
            resolve(phone);
        } else {
            const reason = new Error('mom is not happy');
            reject(reason);
        }

    }
);

const showOff = function (phone) {
    const message = 'Hey friend, I have a new ' +
                phone.color + ' ' + phone.brand + ' phone';
    return Promise.resolve(message);
};

// Вызываем промис
const askMom = function () {
    willIGetNewPhone
        .then(showOff)
        .then(fulfilled => console.log(fulfilled)) // fat arrow
        .catch(error => console.log(error.message)); // fat arrow
};

askMom();

// /_ ES7 _/
const isMomHappy = true;

// Промис
const willIGetNewPhone = new Promise(
    (resolve, reject) => {
        if (isMomHappy) {
            const phone = {
                brand: 'Samsung',
                color: 'black'
            };
            resolve(phone);
        } else {
            const reason = new Error('mom is not happy');
            reject(reason);
        }

    }
);

// 2й промис
async function showOff(phone) {
    return new Promise(
        (resolve, reject) => {
            var message = 'Hey friend, I have a new ' +
                phone.color + ' ' + phone.brand + ' phone';

            resolve(message);
        }
    );
};

// Вызываем промис
async function askMom() {
    try {
        console.log('before asking Mom');

        let phone = await willIGetNewPhone;
        let message = await showOff(phone);

        console.log(message);
        console.log('after asking mom');
    }
    catch (error) {
        console.log(error.message);
    }
}

(async () => {
    await askMom();
})();