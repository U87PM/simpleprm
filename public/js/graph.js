import * as d3 from "d3";

// Get list of ppl from the server & convert to nodes
async function fetchData() {
    const people = await (await fetch("/api/people")).json();
    const nodes = people.map(p => ({
        id: p.id,
        firstName: p.firstName, 
        lastName: p.lastName,
        group: p.group
    }));

    const relationships = await (await fetch("/api/relationships")).json();
    const links = relationships.map(r => ({
        source: r.sourceId,
        target: r.targetId,
        type: r.type
    }));

    return { nodes, links };
}

// Make svg & return width/height
function initSvg() {
    const svg = d3.create("svg")
        .style("display", "block"); //remove gap under baseline or smth
    
    container.append(svg.node());
    windowResize(svg, undefined);

    const zoomLayer = svg.append("g");

    //reference point
    zoomLayer.append("circle")
        .attr("class", "center-marker")
        .attr("r", 4)
        .attr("fill", "red");
    updateCenterMarker(zoomLayer);

    
    const zoom = d3.zoom()
        .scaleExtent([1, 8]) //min/max zoom
        .on("zoom", (e) => {
            zoomLayer.attr("transform", e.transform);
        });
    svg.call(zoom);

    return {svg, zoomLayer};
}

function updateCenterMarker(zoomLayer) {
    zoomLayer.select(".center-marker")
        .attr("cx", window.innerWidth / 2)
        .attr("cy", window.innerHeight / 2);
}

function initNodePositions(nodes, width, height) {
    nodes.forEach(element => {
        element.x = width / 2;
        element.y = height / 2;
    });
}

function drawLinks(svg, links) {
    const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "gray");
    return link;
}

function drawNodes(svg, nodes) {
    //actual html elements
    const node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 18)
        .attr("fill", "steelblue");
    return node;
}

function drawLables(svg, nodes) {
    const label = svg.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .text(d => `${d.firstName} ${d.lastName}`)
        .attr("font-size", 10)
	    .attr("text-anchor", "middle")
        .attr("pointer-events", "none") //dragging
        .style("user-select", "none");
    return label;
}

// SIMULATION

function initSimulation(nodes, links) {
    const simulation = d3.forceSimulation(nodes)
        .alphaMin(0.01)
        //.alphaDecay(0.05)
        .force("collision", d3.forceCollide(22))
        .force("rootCenter", rootCenterForce(nodes[0]))
        .force(
            "link", 
            d3.forceLink(links)
                .id(d => d.id)
                .distance(50)
        );
    return simulation;
} 

function rootCenterForce(root) {
    if (!root) return;
    return function() {
        root.vx += (window.innerWidth / 2 - root.x) * 0.03;
        root.vy += (window.innerHeight / 2 - root.y) * 0.03;
    };
}


function tick(node, link, label) {
    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    label
        .attr("x", d => d.x)
        .attr("y", d => d.y + 4);
    link
		.attr("x1", d => d.source.x)
		.attr("y1", d => d.source.y)
		.attr("x2", d => d.target.x)
		.attr("y2", d => d.target.y);
}

// SCREEN MANIPULATION
function handleDrag(node, simulation) {
    //event is mouse ig?
    function startDrag(event, draggedPerson) {
        simulation.alphaTarget(0.3).restart();
        draggedPerson.fx = draggedPerson.x;
        draggedPerson.fy = draggedPerson.y;
    }
    function duringDrag(event, draggedPerson) {
        draggedPerson.fx = event.x;
        draggedPerson.fy = event.y;
    }
    function stopDrag(event, draggedPerson) {
        simulation.alphaTarget(0);
        //reset forced vals
        draggedPerson.fx = null;
        draggedPerson.fy = null;
    }
    node.call(
        d3.drag()
            .on("start", startDrag)
            .on("drag", duringDrag)
            .on("end", stopDrag)
    );
}

//resize window on call
function windowResize(svg, simulation, zoomLayer) {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    svg.attr("width", newWidth).attr("height", newHeight);
    if (zoomLayer) {
        updateCenterMarker(zoomLayer);
    }
    if (simulation) {
        simulation.alpha(0.3).restart();
    }
}

//resize window dynamically
function enableWindowResize(svg, simulation, zoomLayer) {
    window.addEventListener("resize", () => {
        windowResize(svg, simulation, zoomLayer);
    })
}

async function main() {
    const { nodes, links } = await fetchData();
    const {svg, zoomLayer} = initSvg();

    initNodePositions(nodes, window.innerWidth, window.innerHeight);

    //draw
    const link = drawLinks(zoomLayer, links);
    const node = drawNodes(zoomLayer, nodes);
    const label = drawLables(zoomLayer, nodes);

    //simulation
    const simulation = initSimulation(nodes, links);
    //function definition "() => function()" instead of ", function()"
    //this way function itself is passed rather than it's result
    simulation.on("tick", () => tick(node, link, label));


    //drag
    handleDrag(node, simulation);
    enableWindowResize(svg, simulation, zoomLayer);
}

main();