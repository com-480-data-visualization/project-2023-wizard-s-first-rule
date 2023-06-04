/*

---
RK
---
- japan is putting RolePlay in 4th position and barely play Shooter... ?
- La Wii c'est beaucoup le sport et la music
et le sport c'est la wii aussi
- la DS : la simulation
- Shooters c'est xb360
- par la couleur on peut voir un gros gap entre PS et GBA (no orange)
*/


(function() { // small trick to have 'global' variable only global for this script

    // Set the dimensions and margins of the diagram
    const total_height = 800;
    const margin = 10;

    const categories = ["regionL", "genre", "platform", "regionR"];

    // read datas
    let data, urls;
    // diagram
    let graph, sankey, svg;
    // elements
    let nodes, links, labels, hover;



    // DEFAULTS
    const default_opacity = 0.75;
    const emphase_opacity = 1;
    const shadow_opacity = 0.05;
    const node_width = 50;   // default is 24
    let node_padding = 5; // default is 8
    const iterations = 200;  // default is 6

    const duration = 1500;
    const hide_timeout = 1500;


    // loadAndCreateSankey_json(); // nodes/links pre-computed and loaded from json file
    loadAndCreateSankey();
    // ======================================================================
    // ================================================================= LOAD
    // ======================================================================
    // async function loadAndCreateSankey_json() {
    //     try {
    //         const [read_data, read_urls] = await Promise.all([
    //             d3.json("./datasets/sankey.json"),
    //             d3.json("./datasets/sankey_links.json"),
    //         ]);
    //         data = read_data;
    //         urls = read_urls;
    //         console.log(data);
    //         createDropdowns();
    //         createSankeyDiagram();
    //     } catch (error) {
    //         console.error("Error loading or processing data:", error);
    //     }
    // }

    async function loadAndCreateSankey() {
        try {
            const read_urls = await d3.json("./datasets/sankey_links.json");
            data = await loadSankeyData();
            urls = read_urls;
            createDropdowns();
            createSlider();
            createCheckbox();
            createSankeyDiagram();
        } catch (error) {
            console.error("Error loading or processing data:", error);
        }
    }

    // ======================================================================
    // =============================================================== SANKEY
    // ======================================================================
    function createSankeyDiagram() {

        d3.select("#container")
        .style("display", "flex")
        .style("justify-content", "center")
            .style("align-items", "center");


        d3.select("#grid-container")
            .style("display", "grid")
            .style("grid-template-columns", "1fr 7fr 2fr") // fr=1/10
            .style("width", "100%")
            .style("height", total_height + "px")
            .style("gap", "10px");


        d3.select("#col1-container")
            .style("grid-column","1/2")
            .style("display", "grid")
            .style("grid-template-rows", "5fr 1fr 4fr 2fr"); // fr=1/12
        d3.select("#col2-container")
            .style("grid-column","2/3")
            .style("display", "grid")
            .style("grid-template-rows", "5fr 1fr"); // fr=1/6
        d3.select("#col3-container")
            .style("grid-column","3/4")
            .style("display", "grid")
            .style("grid-template-rows", "5fr 1fr"); // fr=1/6


        const sankey_box = d3.select("#diagram-container").node().getBoundingClientRect();

        // Set up the Sankey generator
        sankey = d3 .sankey()
                    .nodeAlign(d3.sankeyJustify) // sankeyLeft | sankeyRight | sankeyCenter | sankeyJustify
                    .nodeWidth(node_width)  
                    .iterations(iterations)
                    .extent([[margin, margin], [sankey_box.width-margin, sankey_box.height-margin]]);

        // set target/source of link to d.name (as it is in datasets), default is index
        sankey.nodeId(d => d.name);

        // initial sorting is descending value
        sankey.nodeSort((a,b) => {
            if (a.category===b.category) return sortings[dropdown_values[0]](a,b);
        });

        // Diagram rendering
        setSVG();
        drawSankey();
    }


    // ======================================================================
    // ================================================================== SVG
    // ======================================================================
    function setSVG(){
        // Set the graph and color
        graph = sankey(data);
        addColor(data);

        // Create an SVG container for the diagram
        const container = d3    .select("#diagram-container");
        container.style("grid-row","1/2");

        svg = container.append("svg")
                    .attr("width",  "100%")
                    .attr("height", "100%")
                    .append("g");

        // Add links
        links = svg .append("g")
                    .selectAll(".link")
                    .data(graph.links)
                    .join("path")
                    .attr("class", "link");

        // Add nodes
        nodes = svg .append("g")
                    .selectAll(".node")
                    .data(graph.nodes)
                    .join("g")
                    .attr("class", "node")
                    .append("rect");

        // Add labels
        labels = svg .append("g")
                    .selectAll(".label")
                    .data(graph.nodes)
                    .join("text")
                    .attr("class", "label");

        // hover Platform label show image
        labels  .filter(l => l.category === categories[2])
                    .on("mouseover", (event, d) =>{
                        showHoverImage(event, d);
                    })
                    .on("mouseout" , () =>{
                        hideHoverImage();
                    });

        // Add mouse events for hover image
        hover = svg .append("g")
                    .selectAll(".hover")
                    .data(graph.nodes)
                    .join("rect")
                    .attr("class", "hover")
                    .on("mouseover", (event, d) => {
                        if (d.category === categories[2]) {
                            showHoverImage(event, d);
                        }
                        shadows_links(d);
                        createBarchart(d);
                    })
                    .on("mouseout" , (event, d) => {
                        if (d.category === categories[2]) {
                            hideHoverImage();
                        }
                        shadows_reset();
                        removeBarchart();
                    });
    }

    function drawSankey() {

        sankey.nodePadding(node_padding)

        // Update the graph and data
        graph = sankey(data);


        // Transition the links
        links   .transition()
                .duration(duration)
                .attr("d", d3.sankeyLinkHorizontal())
                .attr("stroke", d => graph.nodes[d.source.index].color)
                .attr("stroke-width", d => link_width(d))
                .attr("fill", "none")
                .attr("opacity", default_opacity);

        // Transition the nodes
        nodes   .transition()
                .duration(duration)
                .attr("x", d => d.x0)
                .attr("y", d => d.y0)
                .attr("height", d => d.y1 - d.y0)
                .attr("width",  d => d.x1 - d.x0)
                .attr("fill", d => d.color)
                .attr("stroke", "black");


        const sankey_box = d3.select("#diagram-container").node().getBoundingClientRect();
        // Transition the labels
        labels  .transition()
                .duration(duration)
                .text(d => get_name(d))
                .attr("x", d => d.x0 < sankey_box.width / 2 ? d.x1 + 6 : d.x0 - 6)
                .attr("y", d => (d.y1 + d.y0) / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", d => d.x0 < sankey_box.width / 2 ? "start" : "end");

        // Transition the hover elements
        hover   .transition()
                .duration(duration)
                .attr("x", d => d.x0-node_padding/2)
                .attr("y", d => d.y0-node_padding/2)
                .attr("height", d => (d.y1 - d.y0)+node_padding)
                .attr("width" , d => (d.x1 - d.x0)+node_padding)
                .attr("fill", "transparent");
    }

    // ======================================================================
    // ========================================================== HOVER IMAGE
    // ======================================================================
    function showHoverImage(event, d) {
        const container = d3.select("#hover-image-container");
        const imageUrl = getImageUrl(d.name, urls);
        const wikiUrl = getWikipediaUrl(d.name, urls);

        container.style("grid-row","1/2");
        const image_box = container.node().getBoundingClientRect();

        // prevent hideTimeout to erase new image
        clearTimeout(container.property("hideTimeout"));

        const svgBB =  svg.node().getBBox(); // BoundingBox

        container
            .style("visibility", "visible")
            .attr("width","100%")
            .attr("height","100%")
            .html(`<a href="${wikiUrl}" target="_blank"><img src='${imageUrl}'
                    alt="${d.name}" title="${d.name}" width="${image_box.width}" /></a>`);

        container
            .on("mouseover", () => {
                clearTimeout(container.property("hideTimeout"));
            })
            .on("mouseout", hideHoverImage);
    }

    // Hide Hover Image
    function hideHoverImage() {
        const container = d3.select("#hover-image-container");

        const hideTimeout = setTimeout(() => {
            container.style("visibility", "hidden");
        }, hide_timeout);

        container.property("hideTimeout", hideTimeout);
    }

    // Image URL
    function getImageUrl(name, urls) {
        const url = urls.find(detail => detail.name === name);
        return url ? `./assets/img/platforms/${url.image}` : './assets/img/platforms/Psp-1000.jpg';
    }

    // Wiki URL
    function getWikipediaUrl(name, urls) {
        const url = urls.find(detail => detail.name === name);
        return url ? url.wikipedia : "https://en.wikipedia.org/wiki/Sankey_diagram";
    }

    // ======================================================================
    // ============================================================== SHADOWS
    // ======================================================================
    function shadows_links(d){
        d3  .selectAll(".link")
            .data(graph.links)
            .filter(l => l.source.category === d.category || l.target.category === d.category)
            .attr("opacity", shadow_opacity);

        d3  .selectAll(".link")
            .filter(l => l.source.name === d.name || l.target.name === d.name)
            .attr("opacity", emphase_opacity);

        d3  .selectAll(".node")
            .data(graph.nodes)
            .filter(n => n.category === d.category)
            .attr("opacity", shadow_opacity);
        
        d3  .selectAll(".node")
            .filter(n => n.name === d.name)
            .attr("opacity", emphase_opacity);

    }

    function shadows_reset(){
        d3
            .selectAll(".link")
            .data(graph.links)
            .attr("opacity", default_opacity);   
        
        d3
            .selectAll(".node")
            .data(graph.nodes)
            .attr("opacity", default_opacity);
    }

    // ======================================================================
    // ============================================================ DROPDOWNS
    // ======================================================================
    function createDropdowns(){
        const container = d3.select("#dropdowns-container");

        container
            .style("grid-row","2/3")
            .style("display", "flex")
            .style("flex-direction", "row")
            .style("justify-content", "space-between")



        // for (const category in categories) { // category is the index
        for (const category of categories) {    // category is the value
            const div = container   .append("div")
                                    .attr("id", "dropdown_" + category);
            div .append("p")
                .text(()=>{
                    if (category==categories[0] || category==categories.at(-1)) return category.slice(0, -1);
                    return category;
                })
                .style("text-align", "center")
                .style("text-transform", "capitalize");

            const select = div  .append("select")
                                .on("change", (event) => {
                                    sort_nodes(event.target.value, category);
                                    drawSankey();
                                });
            
            select  .selectAll("option")
                    .data(dropdown_values)
                    .enter()
                    .append("option")
                    .text(d => d)
                    .attr("value", d => d);
        }
    }

    function sort_nodes(value, category){
        sankey.nodeSort((a,b) => {
            if (a.category===b.category){
                if (a.category===category){
                    return sortings[value](a,b);
                } else {
                    // retrieve value of others categories
                    const other_value = d3.select("#dropdown_" + a.category).select("select").node().value;
                    return sortings[other_value](a,b);
                }
            }
        });
    }
    // ============================================================= SORTINGS
    const dropdown_values = ["quantity ↑", "quantity ↓", "name ↑", "name ↓"];
    const dropdown_sortings = [asc_quantity, des_quantity, asc_name, des_name];

    function des_quantity(a,b){
        return a.value-b.value;
    }
    function asc_quantity(a,b){
        return b.value-a.value;
    }
    function des_name(a,b){
        return d3.ascending(a.name, b.name);
    }
    function asc_name(a,b){
        return d3.descending(a.name, b.name);
    }
    // [RK] seems in reversed order... ?
    const sortings = dropdown_values.reduce((obj, key, index) => {
                        obj[key] = dropdown_sortings[index];
                        return obj;
                    }, {});

    // ======================================================================
    // ============================================================= CHECKBOX
    // ======================================================================
    function createCheckbox(){
            const container = d3.select("#checkbox-container");

            container.style("grid-row","2/3");

            const div_link = container.append("div")
                    .attr("id", "checkbox_minLinkWidth");
            div_link
                    .append("input")
                    .attr("type", "checkbox")
                    .attr("id", "padding-toggle")
                    .on("change", (event) => {
                        if(event.target.checked){
                            link_width = d => {
                                if (d.width>0.0) return Math.max(1, d.width);
                                return d.width;
                            }
                        } else link_width = d => d.width;
                        drawSankey();
                    });
                    
            div_link.append("label")
                    .attr("for", "padding-toggle")
                    .text(" link min width");

        const div_chart =  container.append("div")
                    .attr("id", "checkbox_barchartValues");

            div_chart.append("input")
                    .attr("type", "checkbox")
                    .attr("id", "barchartValues-toggle");

            div_chart.append("label")
                    .attr("for", "barchartValues-toggle")
                    .text(" detailed values");
    }
    // default link_width (at loading)
    var link_width = d => d.width;


    // ======================================================================
    // =============================================================== SLIDER
    // ======================================================================
    function createSlider() {
        const container = d3.select("#slider-container");

        container.style("grid-row","3/4")
                .style("display", "flex")
                .style("justify-content", "flex-start")
                .style("align-items", "center");

    
        container
        .append("label")
        .attr("for", "padding-slider")
        .text("Padding: ");
    
        container
        .append("input")
        .attr("type", "range")
        .attr("id", "padding-slider")
        .attr("min", 0)
        .attr("max", 25)
        .attr("step", 5)
        .attr("value", node_padding)
        .style("transform", "rotate(-90deg)")
        .on("input", (event) => {
                node_padding = +event.target.value;
                drawSankey();
            });
    }

    // ======================================================================
    // =============================================================== COLORS
    // ======================================================================
    function addColor(data) {

        const min_factor = 0.8;
        const max_factor = 1.2;
        const interpolation_region   = d3.interpolateRainbow;
        const interpolation_genre    = d3.interpolateRainbow;
        const interpolation_platform = d3.interpolateRainbow;
        /*
            interpolateReds
            interpolateGreens
            interpolateBlues
            interpolatePurples
            interpolateOranges
            interpolateGreys
            ---
            interpolateViridis
            interpolateInferno
            interpolateMagma
            interpolatePlasma
            interpolateWarm
            interpolateCool
            interpolateRainbow
            interpolateCubehelixDefault
        */


        function get_min(type){
            return d3.min(data.nodes, d => {
                if (d.category === type) return d.value;
            });
        }
        function get_max(type){
            return d3.max(data.nodes, d => {
                if (d.category === type) return d.value;
            });
        }

        function get_cScale(type, interpolation){
            return d3.scaleSequential(interpolation)
                    .domain([min_factor*get_min(type), max_factor*get_max(type)]);
        }

        // create color scales
        const colorScaleRegion   = get_cScale(categories[0], interpolation_region);
        const colorScaleGenre    = get_cScale(categories[1], interpolation_genre);
        const colorScalePlatform = get_cScale(categories[2], interpolation_platform);

        // add .color value to nodes
        data.nodes.forEach(node => {

            // RegionL
            if(node.category === categories[0]) {
                node.color = colorScaleRegion(node.value);
                
            // Genre
            } else if (node.category === categories[1]){
                node.color = colorScaleGenre(node.value);
            
            // Platform
            } else if (node.category === categories[2]){
                node.color = colorScalePlatform(node.value);
            }
            // RegionL
            if(node.category === categories[3]) {
                node.color = colorScaleRegion(node.value);
            }
        });
    }
    // ======================================================================
    // ============================================================ LOAD DATA
    // ======================================================================
    async function loadSankeyData() {
        try {
            const raw_data = await d3.csv("./datasets/Video_Games_Sales_as_at_22_Dec_2016.csv");
            return get_sankeyData(raw_data);
        } catch (error) {
            console.error("Error loading or processing data:", error);
        }
    }

    function get_sankeyData(raw_data){
        
        const parsed_data = raw_data.filter(row => row['Genre']!='' && row['Name']!='' && +row['Year_of_Release']<=2016); // lose two line... OK

        const platforms = [... new Set(parsed_data.map(row => row['Platform']))];
        const genres = [... new Set(parsed_data.map(row => row['Genre']))];
        // const regions = ['NA_Sales', 'EU_Sales', 'JP_Sales', 'Other_Sales'];
        const regionsL = ['North AmericaL', 'European UnionL', 'JapanL', 'OtherL'];
        const regionsR = ['North AmericaR', 'European UnionR', 'JapanR', 'OtherR'];
        const map_region = new Map([
            ['North AmericaL', 'NA_Sales'],
            ['North AmericaR', 'NA_Sales'],
            ['European UnionL', 'EU_Sales'],
            ['European UnionR', 'EU_Sales'],
            ['JapanL', 'JP_Sales'],
            ['JapanR', 'JP_Sales'],
            ['OtherL', 'Other_Sales'],
            ['OtherR', 'Other_Sales'],

        ]);

        // SANKEY
        let data_sankey = {
            links: [],
            nodes: []
        };

        // LINKS :
        const source_str = 'source';
        const target_str = 'target';
        const value_str  = 'value';
        regionsL.forEach((r) =>
                genres.forEach((g) =>
                    data_sankey.links.push({
                        [source_str]: r,
                        [target_str]: g,
                        [value_str] : parsed_data.filter(row => row['Genre']==g)
                                                .reduce((acc, row) => acc + parseFloat(row[map_region.get(r)]),0)
                    })
                )
        );
        genres.forEach((g) =>
            platforms.forEach((p) =>
                data_sankey.links.push({
                    [source_str]: g,
                    [target_str]: p,
                    [value_str] : parsed_data.filter(row => row['Genre']==g && row['Platform']==p)
                                            .reduce((acc, row) => acc + parseFloat(row['Global_Sales']),0)
                })
            )
        );
        platforms.forEach((p) =>
            regionsR.forEach((r) =>
                data_sankey.links.push({
                    [source_str]: p,
                    [target_str]: r,
                    [value_str] : parsed_data.filter(row => row['Platform']==p)
                                            .reduce((acc, row) => acc + parseFloat(row[map_region.get(r)]),0)
                })
            )
        );

        // NODES:
        const name_str     = 'name';
        const category_str = 'category';
        regionsL.forEach((r) =>
            data_sankey.nodes.push({
                [name_str]: r,
                [category_str]: 'regionL'
            })
        );
        genres.forEach((g) =>
            data_sankey.nodes.push({
                [name_str]: g,
                [category_str]: 'genre'
            })
        );
        platforms.forEach((p) =>
            data_sankey.nodes.push({
                [name_str]: p,
                [category_str]: 'platform'
            })
        );
        regionsR.forEach((r) =>
            data_sankey.nodes.push({
                [name_str]: r,
                [category_str]: 'regionR'
            })
        );

        return data_sankey;
    }

    function get_name(d){
        if (d.category=='regionR' || d.category=='regionL'){
            return d.name.slice(0, -1);
        }
        return d.name;
    }

    // ======================================================================
    // ============================================================= BARCHART
    // ======================================================================
    function createBarchart(d) {
        const values = get_inoutcoming_values(d);

        const container = d3.select("#barchart-container");

        container.style("grid-row","1/2");
        const chart_box = container.node().getBoundingClientRect();
        const chart_height = chart_box.height - 2*margin;
        container.style("padding-top", margin + "px")

        // Create an SVG container for the diagram
        chart = container   .append("svg")
                            .attr("width",  "100%")
                            .attr("height", chart_height);

                    

        // const central_node_width = node_width;
        const central_node_width = 15
        const bar_width = (chart_box.width - central_node_width)/2;

        // Scale the range of the data in the y domain
        const x_scale = d3  .scaleLinear()
                            .domain([0, d3.max([...values.incoming, ...values.outgoing], d => +d.value)])
                            .range([0, bar_width]);

        const padding_value = 0;
        const y_scale_in = d3   .scaleBand()
                                .domain(values.incoming.map(d => d.name))
                                .range([0, chart_height])
                                .padding(padding_value);
        const y_scale_out = d3  .scaleBand()
                                .domain(values.outgoing.map(d => d.name))
                                .range([0, chart_height])
                                .padding(padding_value);

        // Central Rect
        chart .selectAll(".bars-node")
            .data([d])
            .enter()
            .append("rect")
            .attr("class", "bar-node")
            .attr("fill", "white")
            .attr("x", bar_width)
            .attr("width", central_node_width)
            .attr("y", 0)
            .attr("height", chart_height);
            
        const stroke_width = 3;
        chart .selectAll(".bars-node")
            .data([d])
            .enter()
            .append("rect")
            .attr("class", "bar-node")
            .attr("fill", d => d.color)
            .attr("x", bar_width+stroke_width)
            .attr("width", central_node_width-2*stroke_width)
            .attr("y", 0)
            .attr("height", chart_height);


        // Incoming rect
        chart .selectAll(".bars-in")
            .data(values.incoming)
            .enter()
            .append("rect")
            .attr("class", "bar-in")
            .attr("fill", d => d.color)
            .attr("x", d => bar_width-x_scale(d.value))
            .attr("width",  d => x_scale(d.value))
            .attr("y", d => y_scale_in(d.name))
            .attr("height", y_scale_in.bandwidth());
        chart .selectAll(".bars-in")
            .data(values.incoming)
            .enter()
            .append("text")
            .attr("class", "bar-in-label")
            .attr("x", bar_width-stroke_width)
            .attr("y", d => y_scale_in(d.name) + y_scale_in.bandwidth() / 2)
            .attr("dominant-baseline", "middle")
            .text(d => print_value(d))
            .attr("fill", "black")
            .attr("text-anchor", "end");

        // Outgoing rect
        chart .selectAll(".bars-out")
            .data(values.outgoing)
            .enter()
            .append("rect")
            .attr("class", "bar-out")
            .attr("fill", d => d.color)
            // .attr("fill", d.color)
            .attr("x", bar_width+central_node_width)
            .attr("width",  d => x_scale(d.value))
            .attr("y", d => y_scale_out(d.name))
            .attr("height", y_scale_out.bandwidth());

        chart .selectAll(".bars-out")
            .data(values.outgoing)
            .enter()
            .append("text")
            .attr("class", "bar-out-label")
            .attr("x", bar_width + central_node_width + stroke_width)
            .attr("y", d => y_scale_out(d.name) + y_scale_out.bandwidth() / 2)
            .attr("dominant-baseline", "middle")
            .text(d => print_value(d))
            .attr("fill", "black")
            .attr("text-anchor", "start");


        add_node_value(values);
        
        function print_value(d){
            const check_box = d3.select("#barchartValues-toggle").node();
            if (check_box.checked && d.value > 0.0){
                return d.value;
            }
            return "";
        }
    }

    function removeBarchart() {
        d3.select("#barchart-container").selectAll("svg").remove();
        d3.select("#barchart-container").selectAll("text").remove();
        d3.select("#node-value-container").selectAll("p").remove();
    }

    function add_node_value(values){

        const total_in = values.incoming.reduce((acc, d) => acc + +d.value,0);
        const total_out = values.outgoing.reduce((acc, d) => acc + +d.value,0);
        const total = d3.max([total_in,total_out]);

        const container = d3.select("#node-value-container");
        container.style("display", "flex")
        .style("align-items", "center")
        .style("flex-direction", "column");

        container.append("p")
        .text(`[${values.name}]`)
        .style("margin-bottom", "0")
    .style("padding-bottom", "0");
        container.append("p")
        .text(`${total.toFixed(2)}`)
        .style("margin-top", "0")
    .style("padding-top", "0");
    }


    function get_inoutcoming_values(d){
        let incoming = [], outgoing = [];
        d.targetLinks.forEach((link) => incoming.push(
            {"name": link.source.name, "value": link.value.toFixed(2), "color": link.source.color}
        ));
        d.sourceLinks.forEach((link) => outgoing.push(
            {"name": link.target.name, "value": link.value.toFixed(2), "color": link.target.color}
        ));

        return {
            "incoming": incoming.sort((a, b) => b.value - a.value),
            "outgoing": outgoing.sort((a, b) => b.value - a.value),
            "name"    : get_name(d)
        };
    }
})();