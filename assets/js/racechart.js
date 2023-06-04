/*
inspired from [https://observablehq.com/@d3/bar-chart-race-explained]
*/

(function(){

    const n = 10; // number of shown values
    const k = 2;  // number of interpolaiton per year

    const width = window.innerWidth;
    const margin = {top: 16, right: 6, bottom: 6, left: 0};
    const barSize = 40;
    let x = d3.scaleLinear([0, 1], [margin.left, width - margin.right]);
    let y = d3.scaleBand()
        .domain(d3.range(n + 1))
        .rangeRound([margin.top, margin.top + barSize * (n + 1 + 0.1)])
        .padding(0.1);
    const height = margin.top + barSize * n + margin.bottom;
    const duration = 500/k;

    const categories = ["Genre", "Platform"];
    let category = categories[0];

    let datevalues;
    let colorMap;
    let data;
    let names;

    loadAndCreateRacechart();
    // ======================================================================
    // ============================================================ INTERFACE
    // ======================================================================
    async function loadAndCreateRacechart() {
        try {
            createDropdown();
            createReplayButton();
            data = await loadRacechartData();
            await chart();
        } catch (error) {
            console.error("Error loading or processing data:", error);
        }
    }

    function createDropdown(){
        const container = d3.select("#container");
        const div = container   .append("div")
                                .attr("id", "dropdown")
                                .style("display", "inline-block")
                                .style("padding-left",  margin.left +"px")
                                .style("padding-right", margin.right+"px");

        const select = div  .append("select")
                            .on("change", async function(event) {
                                d3.select("#container svg").remove();
                                category = event.target.value;
                                data = await loadRacechartData();
                                await chart();
                            });
        
        select  .selectAll("option")
                .data(categories)
                .enter()
                .append("option")
                .text(d => d)
                .attr("value", d => d);
    }

    function createReplayButton(){
        d3  .select("#container")
            .append("button")
            .text("Replay")
            .style("display", "inline-block")
            .on("click", async function() {
                d3.select("#container svg").remove();
                await chart();
            });
    }

    // ======================================================================
    // ============================================================ LOAD DATA
    // ======================================================================
    async function loadRacechartData() {
        try {
            const raw_data = await d3.csv("./datasets/Video_Games_Sales_as_at_22_Dec_2016.csv");
            return get_RacechartData(raw_data);
        } catch (error) {
            console.error("Error loading or processing data:", error);
        }
    }

    function get_RacechartData(raw_data){

        const parsed_data = raw_data.filter(row => row['Year']!=''        &&
                                            +row['Year_of_Release']<=2016 &&
                                            row['Genre']!='');

        const cat = [... new Set(parsed_data.map(row => row[category]))];

        const years = [... new Set(parsed_data.map(row => row['Year_of_Release']))];

        const data = []

        const date_str = 'date';
        const name_str = 'name';
        const value_str  = 'value';
        years.forEach((y) =>
            cat.forEach((c) =>
                    data.push({ 
                        [date_str]: y+'-01-01',
                        [name_str]: c,
                        [value_str] : parsed_data.filter(row => row[category]==c && +row['Year_of_Release']<=+y)
                                                .reduce((acc, row) => acc + +row['Global_Sales'],0)
                    })
                )
        );
        names = new Set(data.map(d => d.name))

        const colorvalue = [];
        names.forEach((n) =>
            colorvalue.push({
                [name_str] : n,
                [value_str]: parsed_data.filter(row => row[category]==n)
                                .reduce((acc, row) => acc + +row['Global_Sales'],0)
            })
        );
        const min_factor = 0.8; // same as sankey diagram
        const max_factor = 1.2;
        const colorScale = d3.scaleSequential(d3.interpolateRainbow)
                    .domain([min_factor*d3.min(colorvalue, d => d.value),
                            max_factor*d3.max(colorvalue, d => d.value)]);

        colorMap = new Map();
        colorvalue.forEach(d => {
            colorMap.set(d.name, colorScale(d.value));
        });

        datevalues = Array.from(d3.rollup(data, ([d]) => d.value, d => d.date, d => d.name))
                        .map(([date, data]) => [new Date(date), data])
                        .sort(([a], [b]) => d3.ascending(a, b));

        nameframes = d3.groups(keyframes().flatMap(([, data]) => data), d => d.name);
        prev = new Map(nameframes.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a])));
        next = new Map(nameframes.flatMap(([, data]) => d3.pairs(data)));

        return data;
    }

    // ======================================================================
    // ============================================================== HELPERS
    // ======================================================================
    function rank(value) {
        const data = Array.from(names, name => ({name, value: value(name)}));
        data.sort((a, b) => d3.descending(a.value, b.value));
        for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
        return data;
    }

    function keyframes() {
        const keyframes = [];
        let ka, a, kb, b;
        for ([[ka, a], [kb, b]] of d3.pairs(datevalues)) {
            for (let i = 0; i < k; ++i) {
                const t = i / k;
                keyframes.push([
                    new Date(ka * (1 - t) + kb * t),
                    rank(name => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t)
                ]);
            }
        }
        keyframes.push([new Date(kb), rank(name => b.get(name) || 0)]);
        return keyframes;
    }


    function bars(svg) {
        let bar = svg.append("g")
            .attr("fill-opacity", 0.6)
            .selectAll("rect");
    
        return ([date, data], transition) => bar = bar
            .data(data.slice(0, n), d => d.name)
            .join(
                enter => enter.append("rect")
                    .attr("fill", d => colorMap.get(d.name))
                    .attr("height", y.bandwidth())
                    .attr("x", x(0))
                    .attr("y", d => y((prev.get(d) || d).rank))
                    .attr("width", d => x((prev.get(d) || d).value) - x(0)),
                update => update,
                exit => exit.transition(transition).remove()
                    .attr("y", d => y((next.get(d) || d).rank))
                    .attr("width", d => x((next.get(d) || d).value) - x(0))
            )
            .call(bar => bar.transition(transition)
                .attr("y", d => y(d.rank))
                .attr("width", d => x(d.value) - x(0)));
    }

    function labels(svg) {
        let label = svg.append("g")
            .style("font", "bold 12px var(--sans-serif)")
            .style("font-variant-numeric", "tabular-nums")
            .attr("text-anchor", "end")
            .selectAll("text");
    
        return ([date, data], transition) => label = label
            .data(data.slice(0, n), d => d.name)
            .join(
                enter => enter.append("text")
                    .attr("transform", d => `translate(${x((prev.get(d) || d).value)},${y((prev.get(d) || d).rank)})`)
                    .attr("y", y.bandwidth() / 2)
                    .attr("x", -6)
                    .attr("dy", "-0.25em")
                    .text(d => d.name)
                    .call(text => text.append("tspan")
                        .attr("fill-opacity", 0.7)
                        .attr("font-weight", "normal")
                        .attr("x", -6)
                        .attr("dy", "1.15em")),
                update => update,
                exit => exit.transition(transition).remove()
                    .attr("transform", d => `translate(${x((next.get(d) || d).value)},${y((next.get(d) || d).rank)})`)
                    .call(g => g.select("tspan").tween("text", d => textTween((prev.get(d) || d).value, (next.get(d) || d).value)))
            )
            .call(bar => bar.transition(transition)
                .attr("transform", d => `translate(${x(d.value)},${y(d.rank)})`)
                .call(g => g.select("tspan").tween("text", d => textTween(d.value, (next.get(d) || d).value))))
    }


    formatNumber = d3.format(",d")
    function textTween(a, b) {
        const i = d3.interpolateNumber(a, b);
        return function(t) {
            this.textContent = formatNumber(i(t));
        };
    }

    
    function axis(svg) {
        const g = svg.append("g")
            .attr("transform", `translate(0,${margin.top})`);
    
        const axis = d3.axisTop(x)
            .ticks(width / 160)
            .tickSizeOuter(0)
            .tickSizeInner(-barSize * (n + y.padding()));
    
        return (_, transition) => {
            g.transition(transition).call(axis);
            g.select(".tick:first-of-type text").remove();
            g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white");
            g.select(".domain").remove();
        };
    }

    formatDate = d3.utcFormat("%Y")
    function ticker(svg) {
        const now = svg.append("text")
            .style("font", `bold ${barSize}px var(--sans-serif)`)
            .style("font-variant-numeric", "tabular-nums")
            .attr("text-anchor", "end")
            .attr("x", width - 6)
            .attr("y", margin.top + barSize * (n - 0.45))
            .attr("dy", "0.32em")
            .text(formatDate(keyframes()[0][0]));
    
        return ([date], transition) => {
            transition.end().then(() => now.text(formatDate(date)));
        };
    }

    async function chart() {
        const container = d3.select("#container")

        const div = container.append("div")
                        .style("display", "flex")
                        .style("align-items", "center")
                        .style("flex-direction", "column")

        const svg = div.append("svg")
                    .attr("display", "block")
                    .attr("width", width)
                    .attr("height", height)
            // .attr("viewBox", [0, 0, width, height]);

        const updateBars = bars(svg);
        const updateAxis = axis(svg);
        const updateLabels = labels(svg);
        const updateTicker = ticker(svg);

        for (const keyframe of keyframes()) {
            const transition = svg.transition()
                .duration(duration)
                .ease(d3.easeLinear);

            // Extract the top bar’s value.
            x.domain([0, keyframe[1][0].value]);

            updateAxis(keyframe, transition);
            updateBars(keyframe, transition);
            updateLabels(keyframe, transition);
            updateTicker(keyframe, transition);

            await transition.end();
        }
    }

})();