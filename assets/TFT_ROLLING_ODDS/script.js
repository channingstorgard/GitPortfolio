document.getElementById("setRange").oninput = function(){
    updateSet();
    updateGraph();
}

document.getElementById("costRange").oninput = function(){
    updateCost();
    updateGraph();
}
        
document.getElementById("lvlRange").oninput = function(){
    updateLvl();
    updateGraph();
}

document.getElementById("copiesText").oninput = function(){
    updateGraph();
}

document.getElementById("poolText").oninput = function(){
    updateGraph();
}

document.getElementById("goldText").oninput = function(){
    updateGraph();
}

// Add the new function to calculate gold for a target EV
function calculateGoldForTargetEV(targetEV, cost, lvl, copies, pool, set) {
    let gold = 0;
    let ev = 0;
    const maxGold = 200;

    // Keep increasing gold until the expected value equals or exceeds the target EV
    while (ev < targetEV && gold <= maxGold) {
        ev = getProbs(cost, lvl, copies, pool, gold, set)[2];  // EV is the 3rd return value
        gold += 1;  // Adjust step size if necessary
    }

    if (gold > maxGold) {
        return "Gold limit reached";  // To avoid infinite loops
    }
    return gold;  // Return the amount of gold required
}


function updateSet(){
    var val = document.getElementById("setRange").value
    document.getElementById("setOutput").innerHTML = val
    updateGraph();
}

function updateCost(){
    var val = document.getElementById("costRange").value
    document.getElementById("costOutput").innerHTML = val
    updateGraph();
}

function updateLvl(){
    var val = document.getElementById("lvlRange").value
    document.getElementById("lvlOutput").innerHTML = val
    updateGraph();
}

var set = document.getElementById("setRange")
var cost = document.getElementById("costRange")
var lvl = document.getElementById("lvlRange")
var copies = document.getElementById("copiesText")
var pool = document.getElementById("poolText")
var gold = document.getElementById("goldText")

// Default graph

var ctx = document.getElementById("myChart")


var chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['1','2','3','4','5','6','7','8','9'],
                        datasets: [{
                            label: 'Probability of getting at least x units',
                            data: [0, 0, 0, 0, 0, 0, 0, 0, 0]
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                suggestedMin: 0,
                                suggestedMax: 1,
                                beginAtZero: true
                            }
                        },

                        plugins: {
                            tooltip: {
                                displayColors: false,
                                bodyFont: {
                                    size: 20
                                },
                                callbacks: {

                                    title: function(tooltipItem) {
                                        return '';
                                    },

                                    label: function (tooltipItem) {
                                        var tooltipText = '';
                                        if (tooltipItem.dataset.data[tooltipItem.dataIndex] != null)
                                          tooltipText = tooltipItem.dataset.data[tooltipItem.dataIndex].toString();
                                        return tooltipText;
                                    }
                                }
                            }

                        }
                    }
                });

function updateGraph() {
    const goldValue = parseInt(gold.value); // Get the amount of gold from the input

    // Loop through EVs from 1 to 9 and calculate the gold required for each
    const evResults = [];
    for (let i = 1; i <= 9; i++) {
        const goldForEV = calculateGoldForTargetEV(i, parseInt(cost.value), parseInt(lvl.value), parseInt(copies.value), parseInt(pool.value), parseInt(set.value));
        evResults.push(`Gold for EV = ${i}: ${goldForEV}`);
        console.log(`Gold for EV ${i}: ${goldForEV}`); // Log for debugging
    }

    // Update the graph with cumulative probabilities
    const [pprob, cprob, expectedValue] = getProbs(
        parseInt(cost.value),
        parseInt(lvl.value),
        parseInt(copies.value),
        parseInt(pool.value),
        goldValue,  // Use the gold value from the input
        parseInt(set.value)
    );

    chart.data.datasets = [{
        label: 'Probability of getting at least x units',
        data: cprob.slice(1)  // Use cumulative probabilities (without the 0th value)
    }];
    chart.update();

    // Display the gold required to hit EV from 1 to 9
    for (let i = 1; i <= 9; i++) {
        document.getElementById(`goldForEV${i}`).innerHTML = evResults[i - 1];
    }

    // Display the expected value
    document.getElementById("expectedValueOutput").innerHTML = "Expected Value: " + expectedValue.toFixed(2);
}




// CALCULATIONS

const totalUnitsSet11 = [22, 20, 17, 10, 9]; // Set 11 data kept for comparison purposes
const totalUnitsSet12 = [30, 25, 18, 10, 9];
const distinctChampsSet11 = [13, 13, 13, 12, 8];
const distinctChampsSet12 = [14, 13, 13, 12, 8];

const costProbs = [       // level
  [1,    0,    0,    0,    0],    // 1
  [1,    0,    0,    0,    0],    // 2
  [0.75, 0.25, 0,    0,    0],    // 3
  [0.55, 0.30, 0.15, 0,    0],    // 4
  [0.45, 0.33, 0.20, 0.02, 0],    // 5
  [0.30, 0.40, 0.25, 0.05, 0],    // 6
  [0.19, 0.30, 0.40, 0.10, 0.01], // 7
  [0.18, 0.25, 0.32, 0.22, 0.03], // 8
  [0.10, 0.20, 0.25, 0.35, 0.10], // 9
  [0.05, 0.10, 0.20, 0.40, 0.25], // 10
  [0.01, 0.02, 0.12, 0.50, 0.35]  // 11
];

function getCostProb(lvl, cost){ // 1-indexed
  return costProbs[lvl - 1][cost - 1];
}

// Returns cumulative probability of getting 0-9 copies
// cost: Desired unit cost
// lvl: Current level
// a: Number of copies of this unit already out
// b: Number of units of the same cost already out
// gold: Amount of gold you want to roll
function getProbs(cost, lvl, a, b, gold, set) {
    let mat = getTransitionMatrix(cost, lvl, a, b, set);
    mat = power(mat, 5 * Math.floor(gold / 2)); // Assuming 5 shops per 10 gold

    const pprob = mat[0];  // Probabilities for exactly 0, 1, 2, ..., 9 units

    // Cumulative probabilities for at least 0, 1, 2, ..., 9 of the desired unit
    let cprob = [1];
    for (let i = 1; i < 10; i++) {
        let p = 1;
        for (let j = 0; j < i; j++) {
            p -= pprob[j];
        }
        cprob.push(p.toFixed(2));
    }

    // Calculate Expected Value (EV) for hitting multiple units
    let expectedValue = 0;
    for (let i = 1; i < 10; i++) {
        expectedValue += i * pprob[i];  // Sum up i * P(i)
    }

    return [pprob, cprob, expectedValue];  // Return expected value along with probabilities
}




function getTransitionMatrix(cost, lvl, a, b, set){
    const mat = [];
    for (let i = 0; i < 10; i++) {  // i represents the number of copies hit so far
        const newRow = [];
        for (let j = 0; j < 10; j++) {
            if (i == 9 && j == 9) {
                newRow.push(1); // from X >= 9 to X >= 9, probability is 1
                continue;
            }
            
            // Calculate transition probability accounting for unit depletion
            const p = getTransitionProb(cost, lvl, a + i, b + i, set);
            if (j == i) {
                newRow.push(1 - p);  // Stay in the same state (no additional unit hit)
            } else if (j == i + 1) {
                newRow.push(p);  // Transition to the next state (one more unit hit)
            } else {
                newRow.push(0);  // No direct transition between other states
            }
        }
        mat.push(newRow);
    }
    return mat;
}


// Probability of rolling the desired unit in one shop given this state
function getTransitionProb(cost, lvl, a, b, set){
    const totalUnits = set === 12 ? totalUnitsSet12 : totalUnitsSet11;
    const distinctChamps = set === 12 ? distinctChampsSet12 : distinctChampsSet11;
    const howManyLeft = Math.max(0, totalUnits[cost - 1] - a); // Units left after 'a' copies hit
    const poolSize = totalUnits[cost - 1] * distinctChamps[cost - 1] - b; // Remaining units in the pool
    
    // Probability of hitting the unit, adjusted for depletion
    return getCostProb(lvl, cost) * (howManyLeft / poolSize);
}


//Matrix multiplication rounded to 3 d.p.
function multiply(a, b){
  var aNumRows = a.length, aNumCols = a[0].length,
      bNumRows = b.length, bNumCols = b[0].length,
      m = new Array(aNumRows);  // initialize array of rows
  for (var r = 0; r < aNumRows; ++r) {
    m[r] = new Array(bNumCols); // initialize the current row
    for (var c = 0; c < bNumCols; ++c) {
      m[r][c] = 0;             // initialize the current cell
      for (var i = 0; i < aNumCols; ++i) {
        m[r][c] += a[r][i] * b[i][c];
      }
      m[r][c] = m[r][c]
    }
  }
  return m;
}

function power(a, n){
    var newmat = a
    for (let i = 0; i < n-1; i++) {
        newmat = multiply(newmat, a);
    }
    return newmat;
}
