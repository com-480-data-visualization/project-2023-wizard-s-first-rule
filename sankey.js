loadAndCreateSankey();

const margin = {top: 10, right: 10, bottom: 10, left: 10};

function loadAndCreateSankey(){
    Promise.all([
        d3.json("./datasets/sankey.json"),
        d3.json("./datasets/sankey_links.json"),
    ]).then(([data, links]) => {
        createSankeyDiagram(data, links)
        createSortOptionsDropdown(data, links);
    }).catch(error => {
        console.error("Error loading or processing data:", error);
    });
}

// ================================================
function createSortOptionsDropdown(data, links) {
    const dropdown = document.createElement("select");

    const options = [
      { value: "name", text: "Sort by Name" },
      { value: "value", text: "Sort by Value" },
      { value: "custom1", text: "Custom Sort 1" },
      { value: "custom2", text: "Custom Sort 2" },
      { value: "custom3", text: "Custom Sort 3" },
    ];
  
    options.forEach(({ value, text }) => {
      const option = document.createElement("option");
      option.value = value;
      option.text = text;
      dropdown.appendChild(option);
    });
  
    dropdown.addEventListener("change", (event) => {
        // const hoverImageContainer = d3.select("#hover-image-container");
        // clearTimeout(hoverImageContainer.property("showTimeout"));
        const selectedOption = event.target.value;
        updateSankey(selectedOption, data, links);
    });
  
    const container = document.getElementById("container");
    console.log(container.firstChild)
    container.insertBefore(dropdown, container.firstChild);
  }
// =============================

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
    // const nodeUpdate = data.nodes.selectAll("g.node").data(graph.nodes);
    // const linkUpdate = links.selectAll("path.link").data(graph.links);
}

function createSankeyDiagram(data, urls) {
    // Set the dimensions and margins of the diagram
    const svg_width = 800;
    const svg_height = 600;
    const width = svg_width - margin.left - margin.right;
    const height = svg_height - margin.top - margin.bottom;

    // remove previous svg
    // d3.select("#sankey").select("svg").remove();

    // Create an SVG container for the diagram
    const svg = d3.select("#sankey")
                  .append("svg")
                  // .attr("viewBox", [0,0, svg_width, svg_height])
                  .attr("width",  svg_width)
                  .attr("height", svg_height);
                  // .append("g")
                  // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    const node_width = 15;
    const node_padding = 15;

    // Set up the Sankey generator
    const sankey = d3.sankey()
                     .nodeAlign(d3.sankeyCenter) // sankeyLeft | sankeyRight | sankeyCenter | sankeyJustify
                     .nodeWidth(node_width)   // default is 24
                     .nodePadding(node_padding) // default is 8
                     .iterations(100) // default is 6
                     .extent([[margin.left, margin.top], [svg_width - margin.right, svg_height - margin.bottom]]);

    sankey.nodeId(d => d.name); // set target/source of link to d.name (as it is in datasets), default is index
    // Convert source and target names to indices
    // const nodeIndex = new Map(data.nodes.map((node, index) => [node.name, index]));
    // data.links.forEach(link => {
    //     link.source = nodeIndex.get(link.source);
    //     link.target = nodeIndex.get(link.target);
    // });

    sankey.nodeSort(d => d.index);
    sankey.nodeSort((a,b) => a.value-b.value);// sort nodes in increasing value order
    // sankey.nodeSort((a,b) => b.value-a.value); // sort nodes in decreasing value order
    // sankey.nodeSort((a,b) => b.name.localeCompare(a.name)); // sort all nodes in decreasing order
    // sankey.nodeSort((a,b) => d3.descending(a.name, b.name)); // sort all nodes in increasing alphabetic order (see PS1/PS2/... for example)
    // sankey.nodeSort((a,b) => d3.ascending(a.name, b.name)); // sort all nodes in increasing alphabetic order (see PS1/PS2/... for example)

    // sankey.nodeSort((a,b) => {
    //     if (a.category === 'genre'){
    //         if (a.category === b.category){
    //             return d3.ascending(a.name, b.name)
    //         }
    //     }
    // });


    // Create a Sankey graph from the data
    const graph = sankey(data);

    // Colors
    addColor(data)

    // Create and style the link elements
    const links = svg.append("g")
                     .selectAll("path") // 'g'
                     .data(graph.links)
                     .join("path") // 'g'
                     .attr("d", d3.sankeyLinkHorizontal())
                     .attr("stroke", d => graph.nodes[d.source.index].color)
                    //  .attr("stroke-width", d => Math.max(1, d.width))
                     .attr("stroke-width", d => d.width)
                     .attr("fill", "none")
                     .attr("opacity", 0.5);

    // Create and style the node elements
    const nodes = svg.append("g")
                      .selectAll("g")
                      .data(graph.nodes)
                      .join("g");

    // Add nodes
    nodes.append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        // .attr("height", d => Math.max(1, d.y1 - d.y0))
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => d.color)
        // .attr("fill", d => color(d.name))
        .attr("stroke", "black");
        // .attr("fill", "#69b3a2");

    // Add nodes' labels
    nodes.append("text")
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .text(d => d.name);

    // Add mouse events for hover image
    nodes.append("rect")
         .attr("x", d => d.x0-node_padding/2)
         .attr("y", d => d.y0-node_padding/2)
         .attr("height", d => (d.y1 - d.y0)+node_padding)
         .attr("width", d => (d.x1 - d.x0)+node_padding)
         .attr("fill", "transparent")
         .on("mouseover", (event, d) => showHoverImage(event, d, urls))
         .on("mouseout" , hideHoverImage);
}


// ================================================================
// HOVER IMAGES
// ============

// Show Hover Image
function showHoverImage(event, d, urls) {
    const hoverImageContainer = d3.select("#hover-image-container");
    const imageUrl = getImageUrl(d.name, urls);
    const wikiUrl = getWikipediaUrl(d.name, urls);

    clearTimeout(hoverImageContainer.property("showTimeout"));
    const showTimeout = setTimeout(() => {
        hoverImageContainer
            .style("display", "block")
            .style("left", (event.pageX + 20) + "px")
            .style("top", (event.pageY + 0) + "px")
            .html(`<a href="${wikiUrl}" target="_blank"><img src='${imageUrl}' alt="${d.name}" width="200" /></a>`);

        hoverImageContainer
            .on("mouseover", () => {
                clearTimeout(hoverImageContainer.property("hideTimeout"));
                hoverImageContainer.style("display", "block");
            })
            .on("mouseout", hideHoverImage);
    }, 1000);
    hoverImageContainer.property("showTimeout", showTimeout);
}

// Hide Hover Image
function hideHoverImage() {
    const hoverImageContainer = d3.select("#hover-image-container");
    clearTimeout(hoverImageContainer.property("showTimeout"));
    clearTimeout(hoverImageContainer.property("hideTimeout"));

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
                 .domain([0.5*get_min(type), 1.2*get_max(type)]);
    }

    // create color scales
    const colorScaleRegion   = get_cScale('region', interpolation_region);
    const colorScaleGenre    = get_cScale('genre', interpolation_genre);
    const colorScalePlatform = get_cScale('platform', interpolation_platform);

    // add .color value to nodes
    data.nodes.forEach(node => {
        if(node.category === 'region') {
            node.color = colorScaleRegion(node.value);
        } else if (node.category === 'genre'){
            node.color = colorScaleGenre(node.value);
        } else { // category 'platform'
            node.color = colorScalePlatform(node.value);
        }
    });
}

/*

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

*/