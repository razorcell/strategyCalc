const fastcsv = require("fast-csv");
const fs = require("fs");
const path = require("path");

// const main = require("./app_modules/main.js");
const logger = require("./app_modules/logger.js");

let balance_start = 6000;
let balance = 6000;
let risk_percentage = 0.005;
let wins = 0;
let losses = 0;
let risk_in_usd = 0;
let target_ratio = 2;
let csv_array = [];

for (trial = 0; trial < 100; trial++) {
  let outcome = getOucomeWithProba();
  //   if (outcome === "WIN") {
  //   } else {
  //   }
  risk_in_usd = Math.round(balance * risk_percentage);
  switch (outcome) {
    case "WIN":
      wins++;
      balance += risk_in_usd * target_ratio;
      console.log(
        `Trial : ${trial} | Outcome : ${outcome} | Balance : ${balance} | 0.5% : ${risk_in_usd} | +${risk_in_usd *
          target_ratio}`
      );
      break;
    case "LOSS":
      losses++;
      balance -= risk_in_usd;
      console.log(
        `Trial : ${trial} | Outcome : ${outcome} | Balance : ${balance} | 0.5% : ${risk_in_usd} | -${risk_in_usd}`
      );
      break;
  }
  csv_array = csv_array.concat({
    trial: trial,
    outcome: outcome,
    balance: balance,
    risk_in_usd: risk_in_usd
  });
}
console.log(`WINS = ${wins} - LOSSES = ${losses}`);

saveToCSV(csv_array);

// function generateOutcome() {
//   var outcomes = ["win", "loss"];
//   return outcomes[Math.floor(Math.random() * outcomes.length)];
// }

function getOucomeWithProba() {
  var weights = [0.7, 0.3]; // probabilities
  var results = ["WIN", "LOSS"]; // values to return
  var num = Math.random(),
    s = 0,
    lastIndex = weights.length - 1;

  for (var i = 0; i < lastIndex; ++i) {
    s += weights[i];
    if (num < s) {
      return results[i];
    }
  }

  return results[lastIndex];
}

function saveToCSV(csv_array) {
  let csv_file_name = `${new Date()
    .toISOString()
    .replace(/T/, "_")
    .replace(/(:|-)/g, "")
    .replace(/\..+/, "")}-StrategyTest.csv`;
  // eslint-disable-next-line no-undef
  let full_file_path = path.join(__dirname, "CSV_FILES", csv_file_name);
  console.log(`Saving to file : ${full_file_path}`);
  const ws = fs.createWriteStream(full_file_path);
  //Write the CSV file and return it to the user as a download attachement
  fastcsv.write(csv_array, { headers: true });
}
