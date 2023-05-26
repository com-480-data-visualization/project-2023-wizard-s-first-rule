/*

TODO:

- set padding as a slider
- hovering a node should lower the opacity of others node's link
- set min value to 1 px as a toggle option

- should place labels betters
- better default image... even if never used
- better positions foe image?

- add values in a tooltip for the user to knwo it !

- enlever unkGenre

- connect platforms to region on the right --> hot to handle pictures ?

- show image on graph when hover text or elwhere when shadow node (cause of link shadow)?

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


// Set the dimensions and margins of the diagram
const svg_width            = 900;
const svg_height           = 600;
const platform_image_width = 200;
const margin = {top: 10, right: 10, bottom: 10, left: 10};

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
const node_width = 15;   // default is 24
const node_padding = 10; // default is 8
const reading_padding = 15;
const iterations = 200;  // default is 6

const duration = 1500;
const hide_timeout = 1500;


// loadAndCreateSankey_json(); // nodes/links pre-computed and loaded from json file
loadAndCreateSankey();
// ======================================================================
// =============================================== LOAD AND CREATE SANKEY
// ======================================================================
async function loadAndCreateSankey_json() {
    try {
        const [read_data, read_urls] = await Promise.all([
            d3.json("./datasets/sankey.json"),
            d3.json("./datasets/sankey_links.json"),
        ]);
        data = read_data;
        urls = read_urls;
        console.log(data);
        createDropdowns();
        createSankeyDiagram();
    } catch (error) {
        console.error("Error loading or processing data:", error);
    }
}

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
// =============================================================== CREATE
// ======================================================================
function createSankeyDiagram() {
    // Set up the Sankey generator
    sankey = d3 .sankey()
                .nodeAlign(d3.sankeyJustify) // sankeyLeft | sankeyRight | sankeyCenter | sankeyJustify
                .nodeWidth(node_width)  
                .nodePadding(node_padding)
                .iterations(iterations)
                .extent([[margin.left, margin.top], [svg_width - margin.right, svg_height - margin.bottom]]);

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
    svg = d3    .select("#sankey")
                .append("svg")
                // .attr("viewBox", [0,0, svg_width, svg_height])
                .attr("width",  svg_width)
                .attr("height", svg_height);
                // .append("g")
                // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
                .on("mouseover", (event, d) =>{
                    shadows_links(d);
                    show_tooltip(d);
                })
                .on("mouseout" , () => shadows_reset());

    hover   .filter(h => h.category === categories[2])
            .on("mouseover", (event, d) =>{
                showHoverImage(event, d);
                shadows_links(d);
                show_tooltip(d);

            })
            .on("mouseout" , () =>{
                hideHoverImage();
                shadows_reset();
            });
}

function drawSankey() {

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

    // Transition the labels
    labels  .transition()
            .duration(duration)
            .text(d => {
                if (d.category=='regionR' || d.category=='regionL'){
                    return d.name.slice(0, -1);
                } else  return d.name;
             })
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

    // hide already existing image id hideTimeout not already elapsed
    hoverImageContainer.style("display", "none");

    // prevent showTimeout to erase new image
    clearTimeout(hoverImageContainer.property("showTimeout"));
    const showTimeout = setTimeout(() => {

        // prevent hideTimeout to erase new image
        clearTimeout(hoverImageContainer.property("hideTimeout"));

        const svgBB =  svg.node().getBBox(); // BoundingBox

        hoverImageContainer
            .style("display", "block")
            // .style("left", (event.pageX + 20) + "px")
            // .style("top",  (event.pageY + 0) + "px")
            .style("margin-left", (svgBB.x + svgBB.width + margin.left) + "px")
            .html(`<a href="${wikiUrl}" target="_blank"><img src='${imageUrl}'
                    alt="${d.name}" title="${d.name}" width="${platform_image_width}" /></a>`);

        hoverImageContainer
            .on("mouseover", () => {
                clearTimeout(hoverImageContainer.property("hideTimeout"));
                // hoverImageContainer.style("display", "block");
            })
            .on("mouseout", hideHoverImage);
    }, 1);
    hoverImageContainer.property("showTimeout", showTimeout);
}

// Hide Hover Image
function hideHoverImage() {
    const hoverImageContainer = d3.select("#hover-image-container");

    const hideTimeout = setTimeout(() => {
        hoverImageContainer.style("display", "none");
    }, hide_timeout);

    hoverImageContainer.property("hideTimeout", hideTimeout);
}

function updateImgPosition(event){
    const hoverImageContainer = d3.select("#hover-image-container");
    hoverImageContainer .style("left", (event.pageX + 20) + "px")
                        .style("top",  (event.pageY + 0) + "px")
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
    d3  .selectAll(".link")
        .data(graph.links)
        .attr("opacity", default_opacity);   
    
    d3  .selectAll(".node")
        .data(graph.nodes)
        .attr("opacity", default_opacity);
}

// ======================================================================
// ============================================================ DROPDOWNS
// ======================================================================
function createDropdowns(){
    const container = d3.select("#dropdowns-container");

    container   .style("display", "flex")
                .style("justify-content", "space-between")
                .style("width", (svg_width) +"px");
    // for (const category in categories) { // category is the index
    for (const category of categories) {    // category is the value
        const div = container   .append("div")
                                .attr("id", "dropdown_" + category)
                                .style("padding-left",  margin.left +"px")
                                .style("padding-right", margin.right+"px");
        div .append("p")
            .text(category)
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

// ======================================================================
// ============================================================= CHECKBOX
// ======================================================================
function createCheckbox(){
        const container = d3.select("#checkbox-container");
        container .style("display", "flex")
                  .style("justify-content", "space-between")
                  .style("width", (svg_width) +"px");

        // Deploy
        container.append("div")
                 .attr("id", "checkbox_deploy")
                 .style("padding-left",  margin.left +"px")
                 .style("padding-right", margin.right+"px")
                 .append("label")
                 .text("deploy")
                 .append("input")
                 .attr("type", "checkbox")
                 .attr("id", "padding-toggle")
                 .on("change", (event) => {
                     if(event.target.checked){
                         sankey.nodePadding(reading_padding);
                     } else sankey.nodePadding(0);
                     drawSankey();
                 });

        container.append("div")
                 .attr("id", "checkbox_minLinkWidth")
                 .style("padding-left",  margin.left +"px")
                 .style("padding-right", margin.right+"px")
                 .append("label")
                 .text("link min width")
                 .append("input")
                 .attr("type", "checkbox")
                 .attr("id", "padding-toggle")
                 .on("change", (event) => {
                     if(event.target.checked){
                        link_width = d => Math.max(1, d.width);
                     } else link_width = d => d.width;
                     drawSankey();
                 });
}

var link_width = d => d.width;


// ======================================================================
// =============================================================== SLIDER
// ======================================================================
function createSlider() {
    const container = d3.select("#slider-container");
  
    container
      .style("padding-left", margin.left + "px")
      .style("padding-right", margin.right + "px");
  
    container
      .append("label")
      .attr("for", "padding-slider")
      .text("Padding: ");
  
    container
      .append("span")
      .attr("id", "padding-value")
      .text(node_padding);
  
    container
      .append("input")
      .attr("type", "range")
      .attr("id", "padding-slider")
      .attr("min", 0)
      .attr("max", 20)
      .attr("step", 5)
      .attr("value", node_padding)
    //   .style("width", svg_height+"px")
      .style("width", 100+"px")
      .style("transform", "rotate(-90deg)")
      .on("input", (event) => {
            const paddingValue = +event.target.value; // Convert the value to a number
            sankey.nodePadding(paddingValue);
            drawSankey();
            d3.select("#padding-value").text(paddingValue);
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
// [RK] seems in reversed order... ?
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
// ============================================================== TOOLTIP
// ======================================================================
function show_tooltip(d){

    const total_incoming = d.targetLinks.reduce((acc, link) => acc + link.value, 0);
    const total_outgoing = d.sourceLinks.reduce((acc, link) => acc + link.value, 0);

    d.targetLinks.forEach((link) => console.log(link.source.name + " : "+ link.value.toFixed(2)));
    d.sourceLinks.forEach((link) => console.log(link.target.name + " : "+ link.value.toFixed(2)));

    console.log(total_incoming.toFixed(2));
    console.log(total_outgoing.toFixed(2));
    // tooltip.html("Node: " + d.name + "<br>" + "Total Incoming: " + incoming + "<br>" + "Total Outgoing: " + outgoing);
    // return tooltip.style("visibility", "visible");
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
    
    const parsed_data = raw_data.filter(row => row['Genre']!='' || row['Name']!=''); // lose two line... OK

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