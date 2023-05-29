function handleSelection() {
  var dropdownWidth = document.getElementById("widthDropdown");
  var selectedWidth = dropdownWidth.value;

  var dropdownX = document.getElementById("xDropdown");
  var selectedX = dropdownX.value;

  myFunction(selectedWidth, selectedX);
}


function myFunction(widthCat, xCat) {

console.log("called with: ",widthCat, xCat)

// Base code taken from https://d3-graph-gallery.com/graph/violin_basicHist.html

// set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 30, left: 40},
  width = 1060 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Read the data and compute summary statistics for each specie
d3.csv("/datasets/vgsales.csv", function(data) {

// print the data
console.log(data);

// Build and Show the Y scale
var y = d3.scaleLinear()
  .domain([ 1960,2020 ])          // Note that here the Y scale is set manually
  .range([height, 0])
svg.append("g").call( d3.axisLeft(y) )

const categories = data.map(d => d[xCat])
// Build and Show the X scale. It is a band scale like for a boxplot: each group has an dedicated RANGE on the axis. This range has a length of x.bandwidth
var x = d3.scaleBand()
  .range([ 0, width ])
  .domain(categories)
  .padding(0.05)     // This is important: it is the space between 2 groups. 0 means no padding. 1 is the maximum.
svg.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x))

// Features of the histogram
var histogram = d3.histogram()
      .domain(y.domain())
      .thresholds(y.ticks(20))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
      .value(d => {
        return d.year;
      });

// Compute the binning for each group of the dataset
var sumstat = d3.nest()  // nest function allows to group the calculation per level of a factor
  .key(function(d) { return d[xCat];})
  .rollup(function(d) {   // For each key..
    salesYear = d.map(function(g) {
      return {
        year: g.Year,
        sales: +g[widthCat]
      }
    })

    bins = histogram(salesYear)   // And compute the binning on it.
    return(bins)
  })
  .entries(data)

/**
 * Get the sum of the sales for a given platform
 * @param {Array} a - The array of sales for a given platform
 * @return {Number} The sum of the sales for a given platform
 */
function getSum(a){
  return a
    .map(v => v.sales)
    .reduce((partialSum, a) => partialSum + a, 0)
}

console.log("sumstat: ",sumstat)
// What is the biggest number of value in a bin? We need it cause this value will have a width of 100% of the bandwidth.
var maxNum = 0
for ( i in sumstat ){
  console.log("-", i,": ",sumstat[i])
  allBins = sumstat[i].value
  totalSales = allBins.map(function(a){return getSum(a)})
  console.log("totalSales: ",totalSales)
  longuest = d3.max(totalSales)
  if (longuest > maxNum) { maxNum = longuest }
}

console.error("maxNum: ",maxNum)

// The maximum width of a violin must be x.bandwidth = the width dedicated to a group
var xNum = d3.scaleLinear()
  .range([0, x.bandwidth()])
  .domain([-maxNum,maxNum])

// Add the shape to this svg!
svg
  .selectAll("myViolin")
  .data(sumstat)
  .enter()        // So now we are working group per group
  .append("g")
    .attr("transform", function(d){ return("translate(" + x(d.key) +" ,0)") } ) // Translation on the right to be at the group position
  .append("path")
  .datum(function(d){
    console.log("datum: ",d, "value: ",d.value) 
    return(d.value)
  })     // So now we are working bin per bin
  .style("stroke", "none")
  .style("fill","#69b3a2")
  .attr("d", d3.area()
      .x0(function(d){ return(xNum(-getSum(d))) } )
      .x1(function(d){ return(xNum(getSum(d))) } )
      .y(function(d){ return(y(d.x0)) } )
      .curve(d3.curveCatmullRom)    // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
  )
  // .transition()
  // .duration(1000)
})
}