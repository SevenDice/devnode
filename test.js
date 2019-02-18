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