loadAndCreateSankey();

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

function createSankeyDiagram(data, links) {
    // Set the dimensions and margins of the diagram
    const margin = {top: 10, right: 10, bottom: 10, left: 10};
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // remove previous svg
    // d3.select("#sankey").select("svg").remove();

    // Create an SVG container for the diagram
    const svg = d3.select("#sankey")
        .append("svg")
        .attr("viewBox", [0,
                          0,
                          width + margin.left + margin.right,
                          height + margin.top + margin.bottom])
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // Set up the Sankey generator
    const sankey = d3.sankey()
        .nodeAlign(d3.sankeyCenter)
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

    // Convert source and target names to indices
    const nodeIndex = new Map(data.nodes.map((node, index) => [node.name, index]));
    data.links.forEach(link => {
        link.source = nodeIndex.get(link.source);
        link.target = nodeIndex.get(link.target);
    });

    // Create a Sankey graph from the data
    const graph = sankey(data);

    // Create and style the node elements
    const nodes = svg.append("g")
    .selectAll("g")
    .data(graph.nodes)
    .join("g");
    // .attr("transform", d => `translate(${d.x0},${d.y0})`)

    const uniqueNames = {
        platform: new Set(data.nodes.filter(node => node.category === 'platform').map(node => node.name)),
        region: new Set(data.nodes.filter(node => node.category === 'region').map(node => node.name)),
        genre: new Set(data.nodes.filter(node => node.category === 'genre').map(node => node.name)),
    };

    const platformColors = [];
    const nb_platform = uniqueNames['platform'].size;
    const regionColors = [];
    const nb_region = uniqueNames['region'].size;
    const genreColors = [];
    const nb_genre = uniqueNames['genre'].size;

    const min_color_value = 150;
    const colorScale = d3.scaleLinear()
                         .domain([0, 255])
                         .range([min_color_value, 255]);
    const colorScaleComplement = d3.scaleLinear()
                         .domain([0, 255])
                         .range([255, min_color_value]);

    // RED 
    for (let i = 0; i < nb_region; i++) {
        const color_value = Math.floor((i * 256) / nb_region);
        regionColors.push(`rgb(0,
                               ${colorScale(color_value)},
                               ${colorScaleComplement(color_value)})`);
    }
    // GREEN
    for (let i = 0; i < nb_platform; i++) {
        const color_value = Math.floor((i * 256) / nb_platform);
        platformColors.push(`rgb(${colorScaleComplement(color_value)},
                               0,
                               ${colorScale(color_value)})`);
    }
    // BLUE
    for (let i = 0; i < nb_genre; i++) {
        const color_value = Math.floor((i * 256) / nb_genre);
        genreColors.push(`rgb(${colorScale(color_value)},
                              ${colorScaleComplement(color_value)},
                              0)`);
    }

    function getIndexInCategory(node, categorySets) {
        return Array.from(categorySets[node.category]).indexOf(node.name);
    }
    
    data.nodes.forEach(node => {
        const indexInCategory = getIndexInCategory(node, uniqueNames);
        if (node.category === 'platform') {
            node.color = platformColors[indexInCategory];
        } else if (node.category === 'region') {
            node.color = regionColors[indexInCategory];
        } else if (node.category === 'genre') {
            node.color = genreColors[indexInCategory];
        }
    });

    // const color = d3.scaleOrdinal(graph.nodes.map(d => d.color), d3.schemeCategory10);


    // Create and style the link elements
    svg.append("g")
        .selectAll("path") // 'g'
        .data(graph.links)
        .join("path") // 'g'
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d => graph.nodes[d.source.index].color) // "#000"
        // .attr("stroke", d => color(d.source.name)) // "#000"
        .attr("stroke-width", d => Math.max(1, d.width))
        .style("fill", "none") // why the .style and not .attr ?
        .style("opacity", 0.5);
    
    nodes.append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => d.color)
        // .attr("fill", d => color(d.name))
        .attr("stroke", "black");
        // .attr("fill", "#69b3a2");

    // Add node labels
    nodes.append("text")
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .text(d => d.name);

    // Add mouse events for hover image
    nodes.on("mouseover", (event, d) => showHoverImage(event, d, links))
         .on("mouseout" , hideHoverImage);
}

function showHoverImage(event, d, nodeDetails) {
    const hoverImageContainer = d3.select("#hover-image-container");
    const imageUrl = getImageUrl(d.name, nodeDetails);
    const wikiUrl = getWikipediaUrl(d.name, nodeDetails);

    clearTimeout(hoverImageContainer.property("showTimeout"));
    const showTimeout = setTimeout(() => {
        hoverImageContainer
            .style("display", "block")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY + 10) + "px")
            .html(`<a href="${wikiUrl}" target="_blank"><img src='${imageUrl}' alt="${d.name}" width="200" /></a>`);

        hoverImageContainer
            .on("mouseover", () => {
                clearTimeout(hoverImageContainer.property("hideTimeout"));
                hoverImageContainer.style("display", "block");
            })
            .on("mouseout", hideHoverImage);
    }, 1000);
    hoverImageContainer.property("showTimeout", showTimeout)
}

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

function getImageUrl(nodeName, nodeDetails) {
    const node = nodeDetails.find(detail => detail.name === nodeName);
    return node ? `./assets/img/platforms/${node.image}` : './assets/img/platforms/Psp-1000.jpg';
}

function getWikipediaUrl(nodeName, nodeDetails) {
    const node = nodeDetails.find(detail => detail.name === nodeName);
    return node ? node.wikipedia : "https://en.wikipedia.org/wiki/Sankey_diagram";
}
