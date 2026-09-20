import * as d3 from "d3";

// Get list of ppl from the server & convert to nodes
async function fetchData() {
    const people = await (await fetch("/api/people")).json();
    const nodes = people.map(p => ({
        name: p.firstName, group: p.group
    }));
    return nodes;
}

// Make svg & return width/height
function initSvg() {
    const svg = d3.create("svg")
        .style("display", "block"); //remove gap under baseline or smth
    container.append(svg.node());
    windowResize(svg, undefined);
    return {svg};
}

function initNodePositions(nodes, width, height) {
    nodes.forEach(element => {
        element.x = width / 2;
        element.y = height / 2;
    });
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
        .text(d => d.name)
        .attr("font-size", 10)
	    .attr("text-anchor", "middle");
    return label;
}

// SIMULATION

function initSimulation(nodes) {
    const simulation = d3.forceSimulation(nodes)
        .force("collision", d3.forceCollide(22))
        .force("rootCenter", rootCenterForce(nodes[0]))
    return simulation;
} 

function rootCenterForce(root) {
    return function() {
        root.vx += (window.innerWidth / 2 - root.x) * 0.03;
        root.vy += (window.innerHeight / 2 - root.y) * 0.03;
    };
}


function tick(node, label) {
    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    label
        .attr("x", d => d.x)
        .attr("y", d => d.y + 4);
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
function windowResize(svg, simulation) {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    svg.attr("width", newWidth).attr("height", newHeight);
    if (simulation) {
        simulation.alpha(0.3).restart();
    }
}

//resize window dynamically
function enableWindowResize(svg, simulation) {
    window.addEventListener("resize", () => {
        windowResize(svg, simulation);
    })
}

async function main() {
    const nodes = await fetchData();
    const {svg} = initSvg();

    //initNodePositions(nodes, width, height);

    //draw nodes
    const node = drawNodes(svg, nodes);

    //draw node labels
    const label = drawLables(svg, nodes);

    //simulation
    const simulation = initSimulation(nodes);
    //function definition "() => function()" instead of ", function()"
    //this way function itself is passed rather than it's result
    simulation.on("tick", () => tick(node, label));


    //drag
    handleDrag(node, simulation);
    enableWindowResize(svg, simulation);
}

main();