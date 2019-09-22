const fastcsv = require("fast-csv");
const fs = require("fs");
const path = require("path");

let balance_start = 6000;
let balance = 6000;
let risk_percentage = 0.005;
let wins = 0;
let losses = 0;
let risk_in_usd = 0;
let target_ratio = 2;

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
}
console.log(`WINS = ${wins} - LOSSES = ${losses}`);

// function generateOutcome() {
//   var outcomes = ["win", "loss"];
//   return outcomes[Math.floor(Math.random() * outcomes.length)];
// }

function getOucomeWithProba() {
  var weights = [0.5, 0.5]; // probabilities
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
