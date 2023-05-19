/*

TODO:

- set padding as a slider
- hovering a node should lower the opacity of others node's link
- set min value to 1 px as a toggle option

- should place labels betters
- better default image... even if never used
- better positions foe image?

- add values in a tooltip for the user to knwo it !

*/


// Set the dimensions and margins of the diagram
const svg_width            = 1000;
const svg_height           = 600;
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
const node_padding = 12; // default is 8
const iterations = 100;  // default is 6

const duration = 1500;

loadAndCreateSankey();

// ======================================================================
// ========================================================= LOADING DATA
// ======================================================================
async function loadAndCreateSankey() {
    try {
        const [read_data, read_urls] = await Promise.all([
            d3.json("./datasets/sankey.json"),
            d3.json("./datasets/sankey_links.json"),
        ]);
        data = read_data;
        urls = read_urls;
        createDropdowns();
        createSankeyDiagram();
    } catch (error) {
        console.error("Error loading or processing data:", error);
    }
}

// ======================================================================
// =============================================================== CREATE
// ======================================================================
function createSankeyDiagram() {

    // Create an SVG container for the diagram
    svg = d3.select("#sankey")
            .append("svg")
            // .attr("viewBox", [0,0, svg_width, svg_height])
            .attr("width",  svg_width)
            .attr("height", svg_height);
            // .append("g")
            // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set up the Sankey generator
    sankey = d3 .sankey()
                .nodeAlign(d3.sankeyJustify) // sankeyLeft | sankeyRight | sankeyCenter | sankeyJustify
                .nodeWidth(node_width)  
                .nodePadding(node_padding)
                .iterations(iterations)
                .extent([[margin.left, margin.top], [svg_width - margin.right - platform_image_width, svg_height - margin.bottom]]);

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

    // Add mouse events for hover image
    hover = svg .append("g")
                .selectAll(".hover")
                .data(graph.nodes)
                .join("rect")
                .attr("class", "hover")
                .on("mouseover", (event, d) => showHoverImage(event, d))
                .on("mouseout" , hideHoverImage);
}

function drawSankey() {

    // Update the graph and data
    graph = sankey(data);

    // Transition the links
    links   .transition()
            .duration(duration)
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke", d => graph.nodes[d.source.index].color)
            // .attr("stroke-width", d => d.width)
            .attr("stroke-width", d => Math.max(1, d.width))
            .attr("fill", "none")
            .attr("opacity", 0.5);

    // Transition the nodes
    nodes   .transition()
            .duration(duration)
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width",  d => d.x1 - d.x0)
            .attr("fill", d => d.color)
            .attr("stroke", "black");

    // Transition the labels
    labels  .transition()
            .duration(duration)
            .text(d => d.name)
            .attr("x", d => d.x0 < svg_width / 2 ? d.x1 + 6 : d.x0 - 6)
            .attr("y", d => (d.y1 + d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", d => d.x0 < svg_width / 2 ? "start" : "end");

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
            .style("top",  (event.pageY + 0) + "px")
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

// ======================================================================
// ============================================================ DROPDOWNS
// ======================================================================
function createDropdowns(){
    const container = d3.select("#dropdowns-container");

    container   .style("display", "flex")
                .style("justify-content", "space-between")
                .style("width", (svg_width - platform_image_width) +"px");
    // for (const category in categories) { // category is the index
    for (const category of categories) {    // category is the value
        const div = container   .append("div")
                                .attr("id", "dropdown_" + category)
                                .style("padding-left", margin.left+"px")
                                .style("padding-right", margin.right+"px");
        div .append("p")
            .text(category)
            .style("text-align", "center")
            .style("text-transform", "capitalize");

        const select = div.append("select");
        
        select  .selectAll("option")
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

// ======================================================================
// ============================================================= SORTINGS
// ======================================================================
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
const sortings = dropdown_values.reduce((obj, key, index) => {
                    obj[key] = dropdown_sortings[index];
                    return obj;
                }, {});

// ======================================================================
// =============================================================== COLORS
// ======================================================================
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

// ======================================================================
// ============================================================= OLD CODE
// ======================================================================
/*
function loadAndCreateSankey(){
    Promise.all([
        d3.json("./datasets/sankey.json"),
        d3.json("./datasets/sankey_links.json"),
    ]).then(([read_data, read_urls]) => {
        data = read_data;
        urls = read_urls;
        createDropdowns();
        createSankeyDiagram();
    }).catch(error => {
        console.error("Error loading or processing data:", error);
    });
}
*/