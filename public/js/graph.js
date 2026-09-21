/**
 * @module graph
 */

import * as d3 from "d3";

/**
 * Stores information about a person node. Person properties + mutated for simulation.
 * @typedef {Object} PersonNode
 * @property {number} id                - unique person identifier
 * @property {string} firstName         - person's first name
 * @property {string} lastName          - person's last name
 * @property {string} [group]           - grouping label for person
 * @property {number} x                 - set by initNodePositions; current x position
 * @property {number} y                 - set by initNodePositions; current y position
 * @property {number} [vx]              - set by d3.forceSimulation; x velocity
 * @property {number} [vy]              - set by d3.forceSimulation; y velocity
 * @property {number|null} [fx]         - fixed x position while dragging, null when released
 * @property {number|null} [fy]         - fixed y position while dragging, null when released
 */

/**
 * Stores information about a relationship.
 * @typedef {Object} RelationshipLink
 * @property {PersonNode} source        - resolved by d3.forceLink; source PersonNode object
 * @property {PersonNode} target        - resolved by d3.forceLink; target PersonNode object
 * @property {string} type              - relationship type as a key, matches RELATIONSHIP_TYPES
 */

// ------------------------------------------------------------
// Relationship type management
// ------------------------------------------------------------

let RELATIONSHIP_TYPES = new Map();

/**
 * Fetches relationship type metadata from the server, caching it in RELATIONSHIP_TYPES.
 */
async function loadRelationshipTypes() {
    try {
        const res = await fetch("/api/relationships/types");
        const types = await res.json();

        RELATIONSHIP_TYPES = new Map(types.map(t => [t.key, t]));
    } catch(e) {
        console.error("loadRelationshipTypes: ", e);
    }
}

/**
 * Returns relationship type's metadata by key.
 * @param {string} type - relationship type key.
 * @returns {{key: string, color: string, bidirectional: boolean}|undefined} type metadata, undefined if not found.
 */
function getRelationshipType(type) {
    return RELATIONSHIP_TYPES.get(type);
}

/**
 * Fetches people & relationship metadata from the server. Reshapes them into nodes and links for D3 simulation.
 * @returns {Promise<{nodes: PersonNode[], links: RelationshipLink[]}>} (contains raw source/target ids, not PersonNode objects)
 */
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

/**
 * Creates main svg and mounts relationship marker definitions & zoom layer to it.
 * Creates zoom/pan behaviour. Creates centre marker.
 * @returns {{svg: d3.Selection<SVGSVGElement, undefined, any, any>, zoomLayer: d3.Selection<SVGGElement, undefined, any, any>}}
 */
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

/**
 * Defines arrow markers used for relationship links.
 * @param {d3.Selection<SVGSVGElement, undefined, any, any>} svg 
 */
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

/**
 * Repositions the center reference marker to the middle of the viewport.
 * @param {d3.Selection<SVGGElement, undefined, any, any>} zoomLayer 
 */
function updateCenterMarker(zoomLayer) {
    zoomLayer.select(".center-marker")
        .attr("cx", window.innerWidth / 2)
        .attr("cy", window.innerHeight / 2);
}

/**
 * Sets initial x/y positions for nodes: first node at center, rest arranged in a circle around it.
 * @param {PersonNode[]} nodes 
 * @param {number} width 
 * @param {number} height 
 */
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

/**
 * Binds relationship data to SVG lines and styles them. Handles arrow selection per relationship type.
 * @param {d3.Selection<SVGSVGElement, undefined, any, any>} svg 
 * @param {RelationshipLink[]} links 
 * @returns {d3.Selection<SVGGElement, RelationshipLink, SVGSVGElement, undefined>}
 */
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

/**
 * Binds person data to SVG circles.
 * @param {d3.Selection<SVGSVGElement, undefined, any, any>} svg 
 * @param {PersonNode[]} nodes 
 * @returns {d3.Selection<SVGGElement, PersonNode, SVGGElement, undefined>}
 */
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

/**
 * Binds person data to SVG text labels showing full name.
 * @param {d3.Selection<SVGSVGElement, undefined, any, any>} svg 
 * @param {PersonNode[]} nodes 
 * @returns {d3.Selection<SVGGElement, PersonNode, SVGGElement, undefined>}
 */
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

/**
 * Builds and configures the D3 force simulation: charge, collision, root-centering, and link-range forces.
 * @param {PersonNode[]} nodes 
 * @param {RelationshipLink[]} links 
 * @returns {d3.Simulation<PersonNode, RelationshipLink>}
 */
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

/**
 * Creates custom force: pulls root node into viewport centre.
 * @param {PersonNode} root - root node to pull (nodes[0])
 * @param {number} strength - strength to pull with
 * @returns {function|undefined} - force function for simulation.force()
 */
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

/**
 * Creates custom force that holds links at distance [min, max] by applying forces.
 * @param {RelationshipLink[]} links 
 * @param {{min: number, max: number, strength: number}} options
 * @returns {function} - force function for simulation.force()
 */
function forceLinkRange(links, { min, max, strength}) {
    /**
     * 
     * @param {number} alpha 
     */
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

/**
 * Update svg element positions on each tick.
 * @param {d3.Selection<SVGCircleElement, PersonNode, any, any>} node - circle selection, representing people.
 * @param {d3.Selection<SVGLineElement, RelationshipLink, any, any>} link - line selection, representing relationships.
 * @param {d3.Selection<SVGTextElement, PersonNode, any, any>} label - text selection, representing people's names.
 */
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

/**
 * Attaches D3 drag behaviour to nodes. Connects them to simulation.
 * @param {d3.Selection} node - selection of DOM elements to make draggable.
 * @param {d3.Simulation} simulation - simulation to attach behaviour to.
 */
function handleDrag(node, simulation) {
    /**
     * Handles the initiation of a drag event.
     * @param {d3.D3DragEvent} event - D3 drag event object with cursor coordinates.
     * @param {PersonNode} draggedPerson - data object bound to the dragged node.
     */
    function startDrag(event, draggedPerson) {
        simulation.alphaTarget(0.3).restart();
        draggedPerson.fx = draggedPerson.x;
        draggedPerson.fy = draggedPerson.y;
    }
    /**
     * Updates position coordinates as node is dragged.
     * @param {d3.D3DragEvent} event - D3 drag event object with cursor coordinates.
     * @param {PersonNode} draggedPerson - data object bound to the dragged node.
     */
    function duringDrag(event, draggedPerson) {
        draggedPerson.fx = event.x;
        draggedPerson.fy = event.y;
    }
    /**
     * On drag end, cleans up forced positions & cools down simulation.
     * @param {d3.D3DragEvent} event - D3 drag event object with cursor coordinates.
     * @param {PersonNode} draggedPerson - data object bound to the dragged node.
     */
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

/**
 * Resize SVG window on call. Recenters the marker & reheats simulation if running.
 * @param {d3.Selection<SVGSVGElement, undefined, any, any>} svg 
 * @param {d3.Simulation<PersonNode, RelationshipLink>} simulation 
 * @param {d3.Selection<SVGGElement, undefined, any, any>} zoomLayer 
 */
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

/**
 * Resize window dynamically on viewport change.
 * @param {d3.Selection<SVGSVGElement, undefined, any, any>} svg 
 * @param {d3.Simulation<PersonNode, RelationshipLink>} simulation 
 * @param {d3.Selection<SVGGElement, undefined, any, any>} zoomLayer 
 */
function enableWindowResize(svg, simulation, zoomLayer) {
    window.addEventListener("resize", () => {
        windowResize(svg, simulation, zoomLayer);
    })
}

/**
 * Main execution
 * @returns {Promise<void>}
 */
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