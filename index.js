const fastcsv = require("fast-csv");
const fs = require("fs");
const path = require("path");

// const main = require("./app_modules/main.js");
const logger = require("./app_modules/logger.js");

for (let i = 0; i < 20; i++) {
  generateGame();
}

// function generateOutcome() {
//   var outcomes = ["win", "loss"];
//   return outcomes[Math.floor(Math.random() * outcomes.length)];
// }

function generateGame() {
  let balance = 2189;
  let risk_percentage = 0.015;
  let wins = 0;
  let losses = 0;
  let risk_in_usd = 0;
  let target_ratio = 2;
  let csv_array = new Array();
  let position_net = 0;
  let max_trials = 100;
  let losses_array = new Array();
  let outcome = null;
  let outscomes_buffer = new Array();

  var consecutive_losses = 5;
  let after_consecutive_wins = false;

  for (trial = 0; trial < max_trials; trial++) {
    let target = ((trial / max_trials) * 100) / 100;
    // console.log(`outcomes_buffer[${outscomes_buffer.length}] = ${outscomes_buffer[0]}, ${outscomes_buffer[1]}, ${outscomes_buffer[2]}`);
    if (outscomes_buffer.length == 3) {
      // console.log(`outcomes_buffer ==3`);
      if (
        outscomes_buffer[0] == "WIN" &&
        outscomes_buffer[1] == "WIN" &&
        outscomes_buffer[2] == "WIN"
      ) {
        // console.log(`*** 3 consecutive wins -> FORCE LOSS ***`);
        after_consecutive_wins = true;
      }
      outscomes_buffer.shift();
      outscomes_buffer = outscomes_buffer.filter(Boolean);
      // outscomes_buffer = new Array();
    }

    if (target == 0.25 || target == 0.5 || target == 0.75) {
      // console.log(`Force Consecutive losses --->`);
      for (i = 0; i < consecutive_losses; i++) {
        //filling losses array
        losses_array.push("LOSS");
      }
    }
    if (losses_array.length != 0) {
      //array of losses is full
      outcome = losses_array[0];
      losses_array.pop();
    } else if (after_consecutive_wins) {
      outcome = "LOSS";
      after_consecutive_wins = false;
    } else {
      outcome = getOucomeWithProba();
    }

    outscomes_buffer.push(outcome);
    //   if (outcome === "WIN") {
    //   } else {
    //   }
    risk_in_usd = Math.round(balance * risk_percentage);
    switch (outcome) {
      case "WIN":
        wins++;
        balance += risk_in_usd * target_ratio;
        position_net = risk_in_usd * target_ratio;
        // console.log(
        //   `Trial : ${trial} | Outcome : ${outcome} | Balance : ${balance} | 0.5% : ${risk_in_usd} | +${risk_in_usd *
        //     target_ratio}`
        // );
        // console.log(
        //   `Trial : ${trial} | target : ${target} | Outcome : ${outcome} | Balance : ${balance} | 0.5% : ${risk_in_usd} | +${risk_in_usd *
        //     target_ratio}`
        // );
        break;
      case "LOSS":
        losses++;
        balance -= risk_in_usd;
        position_net = risk_in_usd * -1;
        // console.log(
        //   `Trial : ${trial} | Outcome : ${outcome} | Balance : ${balance} | 0.5% : ${risk_in_usd} | -${risk_in_usd}`
        // );
        // console.log(
        //   `Trial : ${trial} | target : ${target} | Outcome : ${outcome} | Balance : ${balance} | 0.5% : ${risk_in_usd} | -${risk_in_usd}`
        // );
        break;
    }
    csv_array = csv_array.concat({
      trial: trial,
      outcome: outcome,
      balance: balance,
      risk_in_usd: risk_in_usd,
      position_net: position_net
    });
  }
  console.log(`WINS = ${wins}          - LOSSES = ${losses}`);
  console.log(`Final balance : -------------------------- ${balance}`);
  return csv_array;
  // console.log(csv_array);
}

function getOucomeWithProba() {
  var weights = [0.6, 0.4]; // probabilities
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
  fastcsv.write(csv_array, { headers: true, delimiter: ";" }).pipe(ws);
}
