import * as d3 from "d3";

// Get list of ppl from the server & convert to nodes
async function fetchData() {
    const people = await (await fetch("/api/people")).json();
    const nodes = people.map(p => ({
        name: p.name, group: p.group
    }));
    return nodes;
}

// Make svg & return width/height
function initSvg() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block"); //remove gap under baseline or smth
    container.append(svg.node());
    return {svg, width, height};
}

function drawNodes(svg, nodes) {
    const node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 18)
        .attr("fill", "steelblue");
    return node;
}

function initSimulation(nodes) {
    const simulation = d3.forceSimulation(nodes)
        .force()
} 


async function main() {
    const nodes = await fetchData();
    const {svg, width, height} = initSvg();

    //draw nodes
    const node = drawNodes(svg, nodes);
    //draw node labels

    //simulation
    initSimulation(nodes);

    //drag
}

main();