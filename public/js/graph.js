import * as d3 from "d3";

// ------------------------------------------------------------
// Relationship type management
// ------------------------------------------------------------

let RELATIONSHIP_TYPES = new Map();

async function loadRelationshipTypes() {
    try {
        const res = await fetch("/api/relationships/types");
        const types = await res.json();

        RELATIONSHIP_TYPES = new Map(types.map(t => [t.key, t]));
    } catch(e) {
        console.error("loadRelationshipTypes: ", e);
    }
}

function getRelationshipType(type) {
    return RELATIONSHIP_TYPES.get(type);
}



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

    initRelationshipArrowMarkers(svg);

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

    //make it zoomed in from start
    svg.call(
        zoom.transform,
        d3.zoomIdentity
            .translate(window.innerWidth / 2, window.innerHeight / 2)
            .scale(2)
            .translate(-window.innerWidth / 2, -window.innerHeight / 2)
    );

    return {svg, zoomLayer};
}

function initRelationshipArrowMarkers(svg) {
    const defs = svg.append("defs");
    RELATIONSHIP_TYPES.forEach(t => {
        defs.append("marker")
        .attr("id", `arrow-${t.key}`)
        // local coordinate plane. offset (x,y), width, height
        .attr("viewBox", "0 -5 10 10")
        .attr("refX",24) // offset of arrow on the acutal line
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        //draw arrow. move (0,5), line to (10, 0), line to (0,5)
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", t.color);
    });
}

// ------------------------------------------------------------
// Rendering
// ------------------------------------------------------------

function updateCenterMarker(zoomLayer) {
    zoomLayer.select(".center-marker")
        .attr("cx", window.innerWidth / 2)
        .attr("cy", window.innerHeight / 2);
}

function initNodePositions(nodes, width, height) {
    if(nodes[0]) {
        nodes[0].x = width / 2;
        nodes[0].y = height / 2;
    }

    const radius = 250;

    nodes.slice(1).forEach((node, i) => {
        const angle = i * 2 * Math.PI / (nodes.length - 1);

        node.x = width / 2 + Math.cos(angle) * radius;
        node.y = height / 2 + Math.sin(angle) * radius;
    });
}

function drawLinks(svg, links) {
    const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", d => {
            return getRelationshipType(d.type).color;
}       )
        .attr("stroke-width", 2)
        //draw at end of line
        .attr("marker-end", d=> {
            const type = getRelationshipType(d.type);
            if (type.bidirectional) {
                return null;
            }
            return `url(#arrow-${type.key})`;
        });
    return link;
}

function drawNodes(svg, nodes) {
    //actual html elements
    const node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 8)
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
// -----------------------------------------------------------------
// FORCE SIMULATION
// -----------------------------------------------------------------

function initSimulation(nodes, links) {
    const simulation = d3.forceSimulation(nodes)
        //.alphaMin(0.01)
        .force("charge", 
            d3.forceManyBody().
            strength(-20)
        )
        
        .force("collision", 
            d3.forceCollide(10)
        )
        
        .force("rootCenter", 
            rootCenterForce(nodes[0], 0.15)
        )

        .force("link", 
            d3.forceLink(links)
                .id(d => d.id)
                .strength(0)
        )

        .force("linkRange",
            forceLinkRange(links, {min: 50, max: 100, strength: 0.1})
        )
    return simulation;
} 

// pulls root into center
function rootCenterForce(root, strength) {
    if (!root) return;
    function force() {
        const dx = window.innerWidth / 2 - root.x;
        const dy = window.innerHeight / 2 - root.y;
        root.vx += (dx) * strength;
        root.vy += (dy) * strength;
    }
    return force;
}

// manages link length
function forceLinkRange(links, { min, max, strength}) {
    function force(alpha) {
        for (const link of links) {
            const source = link.source;
            const target = link.target;
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            let correction; //how much offset
            if (dist < min) {
                correction = dist - min;
            } else if (dist > max) {
                correction = dist - max;
            } else {
                continue;
            }

            // Unit
            const nx = dx / dist;
            const ny = dy / dist;

            const factor = (correction) * strength * alpha;
            const fx = nx * factor;
            const fy = ny * factor;

            target.vx -= fx;
            target.vy -= fy;
            source.vx += fx;
            source.vy += fy;
        }
    }
    return force;
}


function tick(node, link, label) {
    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    label
        .attr("x", d => d.x)
        .attr("y", d => d.y + 16);
    link
		.attr("x1", d => d.source.x)
		.attr("y1", d => d.source.y)
		.attr("x2", d => d.target.x)
		.attr("y2", d => d.target.y);
}
// -----------------------------------------------------------------
// SCREEN MANIPULATION
// -----------------------------------------------------------------

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
        simulation.alpha(0.3).restart();
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
    await loadRelationshipTypes();

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