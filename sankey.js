// Set the dimensions and margins of the diagram
const svg_width = 1000;
const svg_height = 600;
const platform_image_width = 200;
const margin = {top: 10, right: 10, bottom: 10, left: 10};

const categories = ["region", "genre", "platform"];

// read datas
let data, urls;
// diagram
let graph, sankey, svg;
// elements
let nodes, links, labels, hover;


const node_width = 15;   // default is 24
const node_padding = 0; // default is 8
const iterations = 100;  // default is 6

loadAndCreateSankey();

function loadAndCreateSankey(){
    Promise.all([// elements
        d3.json("./datasets/sankey.json"),
        d3.json("./datasets/sankey_links.json"),
    ]).then(([read_data, read_urls]) => {
        data = read_data;
        urls = read_urls;
        createDropdowns();
        createSankeyDiagram(data, links);
        // createDropdownRegion(data, links);
    }).catch(error => {
        console.error("Error loading or processing data:", error);
    });
}
// =============================

function createSankeyDiagram() {
    // remove previous svg
    // d3.select("#sankey").select("svg").remove();

    // Create an SVG container for the diagram
    svg = d3.select("#sankey")
                  .append("svg")
                  // .attr("viewBox", [0,0, svg_width, svg_height])
                  .attr("width",  svg_width)
                  .attr("height", svg_height);
                  // .append("g")
                  // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set up the Sankey generator
    sankey = d3.sankey()
                     .nodeAlign(d3.sankeyJustify) // sankeyLeft | sankeyRight | sankeyCenter | sankeyJustify
                     .nodeWidth(node_width)  
                     .nodePadding(node_padding)
                     .iterations(iterations)
                     .extent([[margin.left, margin.top], [svg_width - margin.right - platform_image_width, svg_height - margin.bottom]]);

    sankey.nodeId(d => d.name); // set target/source of link to d.name (as it is in datasets), default is index


    // initial sorting is descending value
    sankey.nodeSort((a,b) => {
        if (a.category===b.category) return sortings[dropdown_values[0]](a,b);
    });

    setSVG(node_padding);
    drawSankey();

    // // Create a Sankey graph from the data
    // graph = sankey(data);

    // // Colors
    // addColor(data);

    // // center_nodes(graph);

    // // Create and style the link elements
    // const links = svg.append("g")
    //                  .selectAll("path") // 'g'
    //                  .data(graph.links)
    //                  .join("path") // 'g'
    //                  .attr("d", d3.sankeyLinkHorizontal())
    //                  .attr("stroke", d => graph.nodes[d.source.index].color)
    //                 //  .attr("stroke-width", d => Math.max(1, d.width))
    //                  .attr("stroke-width", d => d.width)
    //                  .attr("fill", "none")
    //                  .attr("opacity", 0.5)
    //                  .attr("class", "link");

    // // Create and style the node elements
    // const nodes = svg.append("g")
    //                   .selectAll("g")
    //                   .data(graph.nodes)
    //                   .join("g")
    //                   .attr("class", "node");

    // // Add nodes
    // nodes.append("rect")
    //     .attr("x", d => d.x0)
    //     .attr("y", d => d.y0)
    //     // .attr("height", d => Math.max(1, d.y1 - d.y0))
    //     .attr("height", d => d.y1 - d.y0)
    //     .attr("width", d => d.x1 - d.x0)
    //     .attr("fill", d => d.color)
    //     // .attr("fill", d => color(d.name))
    //     .attr("stroke", "black");
    //     // .attr("fill", "#69b3a2");

    // // Add nodes' labels
    // nodes.append("text")
    //     .attr("x", d => d.x0 < svg_width / 2 ? d.x1 + 6 : d.x0 - 6)
    //     .attr("y", d => (d.y1 + d.y0) / 2)
    //     .attr("dy", "0.35em")
    //     .attr("text-anchor", d => d.x0 < svg_width / 2 ? "start" : "end")
    //     .text(d => d.name);

    // // Add mouse events for hover image
    // nodes.append("rect")
    //      .attr("x", d => d.x0-node_padding/2)
    //      .attr("y", d => d.y0-node_padding/2)
    //      .attr("height", d => (d.y1 - d.y0)+node_padding)
    //      .attr("width", d => (d.x1 - d.x0)+node_padding)
    //      .attr("fill", "transparent")
    //      .on("mouseover", (event, d) => showHoverImage(event, d, urls))
    //      .on("mouseout" , hideHoverImage);
}


// ================================================================
// HOVER IMAGES
// ============

// Show Hover Image
function showHoverImage(event, d, urls) {
    const hoverImageContainer = d3.select("#hover-image-container");
    const imageUrl = getImageUrl(d.name, urls);
    const wikiUrl = getWikipediaUrl(d.name, urls);

    if(d.category === categories[2]){ // Platform
    // clearTimeout(hoverImageContainer.property("showTimeout"));
    // const showTimeout = setTimeout(() => {

        clearTimeout(hoverImageContainer.property("hideTimeout"));

        hoverImageContainer
            .style("display", "block")
            .style("left", (event.pageX + 20) + "px")
            .style("top", (event.pageY + 0) + "px")
            .html(`<a href="${wikiUrl}" target="_blank"><img src='${imageUrl}' alt="${d.name}" width="${platform_image_width}" /></a>`);

        hoverImageContainer
            .on("mouseover", () => {
                clearTimeout(hoverImageContainer.property("hideTimeout"));
                // hoverImageContainer.style("display", "block");
            })
            .on("mouseout", hideHoverImage);
    // }, 1000);
    // hoverImageContainer.property("showTimeout", showTimeout);
        }
}

// Hide Hover Image
function hideHoverImage() {
    const hoverImageContainer = d3.select("#hover-image-container");

    // Set a timeout to hide the image after 2 seconds
    const hideTimeout = setTimeout(() => {
        hoverImageContainer.style("display", "none");
    }, 500);

    // Store the hideTimeout in the hoverImageContainer's property
    hoverImageContainer.property("hideTimeout", hideTimeout);
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


// ================================================================
// COLORS
// ======
function addColor(data) {

    const min_factor = 0.8;
    const max_factor = 1.2;
    const interpolation_region = d3.interpolateRainbow;
    const interpolation_genre = d3.interpolateRainbow;
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

        // Region
        if(node.category === categories[0]) {
            node.color = colorScaleRegion(node.value);
            
        // Genre
        } else if (node.category === categories[1]){
            node.color = colorScaleGenre(node.value);
        
        // Platform
        } else {
            node.color = colorScalePlatform(node.value);
        }
    });
}

// ===== DROPDOWNS

const dropdown_values = ["quantity ↓", "quantity ↑", "name ↓", "name ↑"];

function createDropdowns(){
    const container = d3.select("#dropdowns-container");

    container.style("display", "flex")
             .style("justify-content", "space-between")
             .style("width", (svg_width - platform_image_width) +"px");
    // for (const category in categories) { // category is the index
    for (const category of categories) {    // category is the value
        const div = container.append("div")
                             .attr("id", "dropdown_" + category)
                             .style("padding-left", margin.left+"px")
                             .style("padding-right", margin.right+"px");
        div.append("p")
           .text(category)
           .style("text-align", "center")
           .style("text-transform", "capitalize");

        const select = div.append("select");
        
        select.selectAll("option")
            .data(dropdown_values)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);
    }

    dropdownEventHandler();
}

function dropdownEventHandler(){
    for (const category of categories) {
        const dropdown = d3.select("#dropdown_" + category).select("select").node(); // .node() is to retrieve the DOM element

        dropdown.addEventListener("change", (event) => {
            sort_nodes(event.target.value, category);
            drawSankey();
        });
    }
}

function setSVG(){
    // Set the graph and color
    graph = sankey(data);
    addColor(data);

    // Create links
    links = svg .append("g")
                .selectAll(".link")
                .data(graph.links)
                .join("path")
                .attr("class", "link");

    // Create nodes
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

    // Add mouse events for hover image
    hover = svg .append("g")
                .selectAll(".hover")
                .data(graph.nodes)
                .join("rect")
                .attr("class", "hover")
                .on("mouseover", (event, d) => showHoverImage(event, d, urls))
                .on("mouseout" , hideHoverImage);
}

function drawSankey() {

    const duration = 1000;

    // Update the graph and data
    graph = sankey(data);

    // Transition the links
    links.transition()
        .duration(duration)
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d => graph.nodes[d.source.index].color)
        .attr("stroke-width", d => d.width)
        .attr("fill", "none")
        .attr("opacity", 0.5);

    // Transition the nodes
    nodes.transition()
        .duration(duration)
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => d.color)
        .attr("stroke", "black");

    // Transition the labels
    labels.transition()
        .duration(duration)
        .text(d => d.name)
        .attr("x", d => d.x0 < svg_width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < svg_width / 2 ? "start" : "end");

    // Transition the hover elements
    hover.transition()
        .duration(duration)
        .attr("x", d => d.x0-node_padding/2)
        .attr("y", d => d.y0-node_padding/2)
        .attr("height", d => (d.y1 - d.y0)+node_padding)
        .attr("width", d => (d.x1 - d.x0)+node_padding)
        .attr("fill", "transparent");
}

// function setSVG(){
//     graph = sankey(data);

//     // Colors
//     addColor(data);

//     // LINKS
//     svg
//         .append("g")
//         .selectAll("path") // 'g'
//         .data(graph.links)
//         .join("path") // 'g'
//         .attr("class", "link");

//     // NODES
//     svg
//         .append("g")
//         .selectAll("g")
//         .data(graph.nodes)
//         .join("g")
//         .attr("class", "node");

// }

// function drawSankey(){
//     const duration = 1000;
//     graph = sankey(data);


//     links = svg.selectAll(".link")

//     links
//         .transition()
//         .duration(duration)
//         .attr("d", d3.sankeyLinkHorizontal())
//         .attr("stroke", d => graph.nodes[d.source.index].color)
//     //  .attr("stroke-width", d => Math.max(1, d.width))
//         .attr("stroke-width", d => d.width)
//         .attr("fill", "none")
//         .attr("opacity", 0.5);


//     nodes = svg.selectAll(".node");

//     // Add nodes
//     nodes
//         .append("rect")
//         .attr("x", d => d.x0)
//         .attr("y", d => d.y0)
//         // .attr("height", d => Math.max(1, d.y1 - d.y0))
//         .attr("height", d => d.y1 - d.y0)
//         .attr("width", d => d.x1 - d.x0)
//         .attr("fill", d => d.color)
//         // .attr("fill", d => color(d.name))
//         .attr("stroke", "black");
//         // .attr("fill", "#69b3a2");

//     // Add nodes' labels
//     nodes.append("text")
//         .attr("x", d => d.x0 < svg_width / 2 ? d.x1 + 6 : d.x0 - 6)
//         .attr("y", d => (d.y1 + d.y0) / 2)
//         .attr("dy", "0.35em")
//         .attr("text-anchor", d => d.x0 < svg_width / 2 ? "start" : "end")
//         .text(d => d.name);

//     // Add mouse events for hover image
//     nodes.append("rect")
//             .attr("x", d => d.x0-node_padding/2)
//             .attr("y", d => d.y0-node_padding/2)
//             .attr("height", d => (d.y1 - d.y0)+node_padding)
//             .attr("width", d => (d.x1 - d.x0)+node_padding)
//             .attr("fill", "transparent")
//             .on("mouseover", (event, d) => showHoverImage(event, d, urls))
//             .on("mouseout" , hideHoverImage);
// }

function updateGraph() {

    const duration = 1000;

    graph = sankey(data);

    // Bind new data to nodes
    const nodes = svg.selectAll(".node").data(graph.nodes);

    // Update nodes
    nodes
        .transition()
        .duration(duration)
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0);

    // Update node text
    svg.selectAll(".node text")
        .transition()
        .duration(duration)
        .attr("x", d => d.x0 < svg_width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2);


    // Bind new data to links
    let links = svg.selectAll(".link").data(graph.links);

    // Update links
    links
        .transition()
        .duration(duration)
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke-width", d => d.width);
}

// ===== SORTING

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

function des_quantity(a,b){
    return b.value-a.value;
}
function asc_quantity(a,b){
    return a.value-b.value;
}
function des_name(a,b){
    return d3.descending(a.name, b.name);
}
function asc_name(a,b){
    return d3.ascending(a.name, b.name);
}

const sortings = {
    "quantity ↓":des_quantity,
    "quantity ↑":asc_quantity,
    "name ↓":des_name,
    "name ↑":asc_name
};

/*

OLD FUNCTIONS


function createDropdownRegion() {
    const dropdown = document.createElement("select");

    const options = [
      { value: "asc_qt", text: "quantity ↓" },
      { value: "des_qt", text: "quantity ↑" },
      { value: "asc_al", text: "alphabetic ↓" },
      { value: "des_al", text: "alphabetic ↑" }
    ];
  
    options.forEach(({ value, text }) => {
      const option = document.createElement("option");
      option.value = value;
      option.text = text;
      dropdown.appendChild(option);
    });
  
    dropdown.addEventListener("change", (event) => {
        console.log('change status')
        let selectedValue = event.target.value;
        console.log(selectedValue)

        if (selectedValue === "asc_qt") {
            console.log('ascending selected')
            sankey.nodeSort((a, b) => d3.ascending(a.index, b.index));
        } else if (selectedValue === "des_qt") {
            console.log('descending selected')
            sankey.nodeSort((a, b) => d3.descending(a.index, b.index));
        }

        graph = sankey(data);
        updateGraph();
        // const hoverImageContainer = d3.select("#hover-image-container");
        // clearTimeout(hoverImageContainer.property("showTimeout"));
        // const selectedOption = event.target.value;
        // updateSankey(selectedOption, data, links);
    });
  
    const container = document.getElementById("container");
    console.log(container.firstChild)
    container.insertBefore(dropdown, container.firstChild);
  }



function addColor(data) {

    // set of categories
    const categories = {
        platform: new Set(data.nodes.filter(node => node.category === 'platform').map(node => node.name)),
        region: new Set(data.nodes.filter(node => node.category === 'region').map(node => node.name)),
        genre: new Set(data.nodes.filter(node => node.category === 'genre').map(node => node.name)),
    };

    // Color Scale
    const min_color_value = 150;
    const colorScale = d3.scaleLinear()
                         .domain([0, 255])
                         .range([min_color_value, 255]);
    const colorScaleComplement = d3.scaleLinear()
                         .domain([0, 255])
                         .range([255, min_color_value]);

    // Region
    const regionColors = [];
    const nb_region = categories['region'].size;
    for (let i = 0; i < nb_region; i++) {
        const color_value = Math.floor((i * 256) / nb_region);
        regionColors.push(`rgb(0,
                               ${colorScale(color_value)},
                               ${colorScaleComplement(color_value)})`);
    }
    // Platform
    const platformColors = [];
    const nb_platform = categories['platform'].size;
    for (let i = 0; i < nb_platform; i++) {
        const color_value = Math.floor((i * 256) / nb_platform);
        platformColors.push(`rgb(${colorScaleComplement(color_value)},
                               0,
                               ${colorScale(color_value)})`);
    }
    // Genre
    const genreColors = [];
    const nb_genre = categories['genre'].size;
    for (let i = 0; i < nb_genre; i++) {
        const color_value = Math.floor((i * 256) / nb_genre);
        genreColors.push(`rgb(${colorScale(color_value)},
                              ${colorScaleComplement(color_value)},
                              0)`);
    }

    // const color = d3.scaleOrdinal(graph.nodes.map(d => d.color), d3.schemeCategory10);
    
    // map name to index
    function getIndexInCategory(node, categories) {
        return Array.from(categories[node.category]).indexOf(node.name);
    }
    
    // add .color value to nodes
    data.nodes.forEach(node => {
        const indexInCategory = getIndexInCategory(node, categories);
        if (node.category === 'platform') {
            node.color = platformColors[indexInCategory];
        } else if (node.category === 'region') {
            node.color = regionColors[indexInCategory];
        } else if (node.category === 'genre') {
            node.color = genreColors[indexInCategory];
        }
    });
}


function updateSankey(selectedOption, data, links) {
    // Sort nodes based on the selected option
    switch (selectedOption) {
        case "name":
            data.nodes.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case "value":
            data.nodes.sort((a, b) => b.value - a.value);
            break;
        case "custom1":
            // Add custom sort function 1
            break;
        case "custom2":
            // Add custom sort function 2
            break;
        case "custom3":
            // Add custom sort function 3
            break;
        default:
            break;
    }
    const nodeUpdate = data.nodes.selectAll("g.node").data(graph.nodes);
    const linkUpdate = links.selectAll("path.link").data(graph.links);
}



function center_nodes(graph){
    // Compute the Sankey layout
    // sankey(graph);

    // Adjust the y-position of nodes
    graph.nodes.forEach(function(node) {
        if (node.category === 'region') {
            node.y0 -= 60;  // pseudo-padding for category1
            node.y1 -= 60;  // pseudo-padding for category1
        } else if (node.category === 'genre') {
            node.y0 += 40;  // pseudo-padding for category2
            node.y1 += 40;  // pseudo-padding for category2
        }
    });

    // Redraw the nodes and links with the adjusted positions
    svg.selectAll("node")
        .data(graph.nodes)
        .enter().append("rect")
        .attr("x", function(d) { return d.x0; })
        .attr("y", function(d) { return d.y0; })
        .attr("height", function(d) { return d.y1 - d.y0; })
        .attr("width", sankey.nodeWidth());

    svg.selectAll("link")
        .data(graph.links)
        .enter().append("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke-width", function(d) { return Math.max(1, d.width); });
}

*/