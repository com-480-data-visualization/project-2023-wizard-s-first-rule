d3.csv('./datasets/graph_3.csv', (data) => {
  // Convert sales values to numbers
  data.forEach((d) => {
    d.Sales = +d.Sales;
    d.Year = +d.Year;
  });

  const salesByLocationByYear = d3.rollup(data, (v) => d3.sum(v, (d) => d.Sales), (d) => d.Location, (d) => d.Year);

  // Calculate total sales for each genre within each location and year
  const salesByLocationGenreYear = d3.rollup(data, (v) => d3.rollup(v, (d) => d3.sum(d, (e) => e.Sales), (d) => d.Year, (d) => d.Genre), (d) => d.Location);

  // Calculate the proportion of sales for each genre within each location and year
  const proportionData = [];
  salesByLocationGenreYear.forEach((value, key) => {
    const location = key;
    const yearSales = Array.from(value, ([year, genreSales]) => ({
      year,
      sales: Array.from(genreSales, ([genre, sales]) => ({ genre, sales })),
    }));
    const yearProportionSales = yearSales.map((d) => ({
      year: d.year,
      proportionSales: d.sales.map((s) => ({
        genre: s.genre,
        proportion: s.sales / salesByLocationByYear.get(location).get(d.year),
      })),
    }));
    proportionData.push({ location, yearProportionSales });
  });

  const margin = {
    top: 20, right: 30, bottom: 70, left: 40,
  };
  const width = 1200 - margin.left - margin.right;
  const height = 430 - margin.top - margin.bottom;

  // Create the SVG element
  const svg = d3.select('#ocean_dataviz')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Set up scales for x, y, and year
  const x = d3.scaleBand()
    .domain(data.map((d) => d.Location))
    .range([0, width])
    .padding(0.01);

  const y = d3.scaleLinear()
    .domain([0, 1])
    .range([height, 3]);

  const yearScale = d3.scaleLinear()
    .domain(d3.extent(data, (d) => d.Year))
    .range([0, width])
    .nice();

  // Set up the color scale for the genres
  const color = d3.scaleOrdinal()
    .domain(proportionData.flatMap((d) => d.yearProportionSales.flatMap((p) => p.proportionSales.map((q) => q.genre))))
    .range(d3.schemeCategory10);

  // Create a stack generator

  const stack = d3.stack()
    .keys(proportionData[0].yearProportionSales[0].proportionSales.map((d) => d.genre))
    .value((d, key) => (d.proportionSales.find((p) => p.genre === key) || { proportion: 0.00001 }).proportion);

  const startData = proportionData.map((d) => ({
    location: d.location,
    proportionSales: d.yearProportionSales.find((p) => p.year === 2016).proportionSales,
  }));

  const defs = svg.append('svg:defs');

  const all_genres = ['Sports', 'Platform', 'Racing', 'Role-Playing', 'Puzzle', 'Misc',
    'Simulation', 'Action', 'Shooter', 'Fighting', 'Adventure',
    'Strategy'];

  // create objects for each icon of genre
  let i = 0;
  while (i < all_genres.length) {
    name = all_genres[i];
    defs.append('svg:pattern')
      .attr('id', name)
      .attr('width', 30)
      .attr('height', 30)
      .attr('patternUnits', 'userSpaceOnUse')
      .append('svg:image')
      .attr('xlink:href', `./assets/img/graph3/${name}.png`)
      .attr('width', 30)
      .attr('height', 30)
      .attr('x', 0)
      .attr('y', 0);
    i++;
  }

  svg.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height + 3)
    .attr('fill', 'black');

  // Generate the stacked bars
  const series = svg.selectAll('.series')
    .data(stack(startData))
    .enter()
    .append('g')
    .attr('class', 'series')
    .attr('fill', (d) => {
      d.forEach((rect) => rect.Genre = d.key); // Add colorKey property to each rectangle data
      return color(d.key);
    })
    .style('fill', (d) => `url(#${d.key})`);

  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  series.selectAll('rect')
    .data((d) => d)
    .enter()
    .append('rect')
    .attr('x', (d) => x(d.data.location))
    .attr('y', (d) => y(d[1]))
    .attr('height', (d) => y(d[0]) - y(d[1]))
    .attr('width', x.bandwidth())
    .attr('stroke', 'grey')
    .attr('stroke-width', 0.5)
    .on('mouseover', (d) => {
      const to_display = `${d.Genre} ${((d[1] - d[0]) * 100).toFixed(1)}%`;
      tooltip.transition()
        .duration(200)
        .style('opacity', 0.9);
      tooltip.html(to_display)
        .style('left', `${d3.event.pageX}px`)
        .style('top', `${d3.event.pageY - 28}px`);
    })
    .on('mousemove', (d) => { // Update tooltip position and text on mousemove
      const to_display = `${d.Genre} ${((d[1] - d[0]) * 100).toFixed(1)}%`;
      tooltip.html(to_display)
        .style('left', `${d3.event.pageX}px`)
        .style('top', `${d3.event.pageY - 28}px`);
      tooltip.style('left', `${d3.event.pageX}px`)
        .style('top', `${d3.event.pageY - 28}px`);
    })
    .on('mouseout', (d) => {
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
    });

  const loc_to_display = { NA_Sales: 'North America', EU_Sales: 'Europe', JP_Sales: 'Japan' };

  // Add x-axis
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat((d) => `${loc_to_display[d]}`))
    .select('.domain')
    .remove();

  const valueDisplay = d3.select('body')
    .append('div')
    .style('text-align', 'center')
    .style('margin-top', '10px');

  // Add year slider
  const slider = d3.select('body')
    .append('input')
    .attr('type', 'range')
    .attr('min', d3.min(data, (d) => d.Year))
    .attr('max', d3.max(data, (d) => d.Year))
    .attr('value', d3.min(data, (d) => d.Year))
    .attr('step', 1)
    .style('width', `${width}px`)
    .style('background-color', '#37517e') // Change the background color of the slider track
    .style('outline', 'none') // Remove the default outline
    .style('appearance', 'none') // Remove the default platform-specific styling
    .style('position', 'absolute')
    .style('left', '70px')
    .style('top', '400px')
    .on('input', function () {
      const selectedYear = +this.value;
      updateStackedBars(selectedYear);
      updateValueDisplay(selectedYear);
    });

  // Add play button
  const playButton = d3.select('body')
    .append('button')
    .text('Play')
    .style('position', 'absolute')
    .style('left', '20px') // Adjust the left position as desired
    .style('top', '400px') // Adjust the top position as desired
    .on('click', () => {
      let playInterval;
      let currentValue = +slider.attr('value');
      const maxValue = +slider.attr('max');

      // Define the play function
      function play() {
        if (currentValue < maxValue) {
          currentValue++;
          slider.property('value', currentValue); // Update the slider value
          updateStackedBars(currentValue); // Update the stacked bars
          updateValueDisplay(currentValue); // Update the value display
        } else {
          stop(); // Stop playing when reaching the maximum value
        }
      }

      // Define the stop function
      function stop() {
        clearInterval(playInterval); // Clear the interval
      }

      // Start playing on button click
      playInterval = setInterval(play, 1000); // Call the play function every second
    });

  const na_outline = svg.append('image')
    .attr('xlink:href', './assets/img/graph3/NA_outline.png')
    .attr('width', 250)
    .attr('height', 250)
    .attr('x', 60)
    .attr('y', 50)
    .classed('transparent-image', true);

  const eu_outline = svg.append('image')
    .attr('xlink:href', './assets/img/graph3/europe_outline.png')
    .attr('width', 250)
    .attr('height', 250)
    .attr('x', 450)
    .attr('y', 50)
    .classed('transparent-image', true);

  const jp_outline = svg.append('image')
    .attr('xlink:href', './assets/img/graph3/japan_outline.png')
    .attr('width', 250)
    .attr('height', 250)
    .attr('x', 830)
    .attr('y', 40)
    .classed('transparent-image', true);

  updateValueDisplay(1985);

  // Function to update the value display
  function updateValueDisplay(value) {
    const sliderRect = slider.node().getBoundingClientRect();
    valueDisplay
      .style('position', 'absolute')
      .style('left', `${sliderRect.left}px`)
      .style('top', `${sliderRect.bottom + 10}px`)
      .text(`Selected Year: ${value}`);
  }

  // Function to update the stacked bars based on the selected year
  function updateStackedBars(year) {
    const selectedData = proportionData.map((d) => ({
      location: d.location,
      proportionSales: d.yearProportionSales.find((p) => p.year === year).proportionSales,
    }));

    const updatedSeries = svg.selectAll('.series')
      .data(stack(selectedData))
      .attr('fill', (d) => {
        d.forEach((rect) => rect.Genre = d.key); // Add colorKey property to each rectangle data
        return color(d.key);
      });

    updatedSeries.selectAll('rect')
      .data((d) => d)
      .transition()
      .duration(500)
      .attr('x', (d) => x(d.data.location))
      .attr('y', (d) => y(d[1]))
      .attr('height', (d) => y(d[0]) - y(d[1]))
      .attr('width', x.bandwidth());
  }
});
