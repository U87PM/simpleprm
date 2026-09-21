
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const birthdayInput = document.getElementById("birthday");
 
const relPersonInput = document.getElementById("relPersonInput");
const relSuggestions = document.getElementById("relSuggestions");
const relTypeSelect = document.getElementById("relType");
const pendingList = document.getElementById("pendingList");


// ------------------------------------------------------------
// AUTOCOMPLEETE
// ------------------------------------------------------------
// prevent query spam ie for "abc" instead of sending 3 queries
// would wait until stopped typing & send 1
let searchDebounceTimer = null; 


async function searchPeople(query) {
    try {
        //encodeURIComponent strips non uri chars.
        const res = await fetch(`/api/people/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) {
            return [];
        }
        const body = await res.json();
        return body;
    } catch(e) {
        console.log("searchPeople: ", e);
        return [];
    }
}

// called when suggestion is clicked
function selectPerson(p) {
    selectedPerson = {
        id: p.id,
        name: `${p.firstName} ${p.lastName || ""}`.trim()
    };
    //set to selected name & reset
    relPersonInput.value = selectedPerson.name;
    renderSuggestions([]);
}

function clearSelectedPerson() {
    selectedPerson = null;
    renderSuggestion([]);
}

function renderSuggestion(person) {
    const li = document.createElement("li");
    li.textContent = `${person.firstName} ${person.lastName || ""}`.trim();
    li.addEventListener("click", () => {
        selectPerson(person);
    });
    return li;
}

function renderSuggestions(people) {
    relSuggestions.innerHTML = "";
    if (!people || people.length == 0) {
        //relSuggestions.style.display = "none";
        return;
    }

    people.forEach(person => {
        relSuggestions.appendChild(renderSuggestion(person));
    })
}

// ------------------------------------------------------------
// AUTOCOMPLETE EVENT LISTENERS
// ------------------------------------------------------------

relPersonInput.addEventListener("input", () => {
    selectedPerson = null;
    clearTimeout(searchDebounceTimer);
    const query = relPersonInput.value.trim();

    if(!query) {
        renderSuggestions([]);
        return;
    }

    searchDebounceTimer = setTimeout(async () => {
        const results = await searchPeople(query);
        renderSuggestions(results);
    }, 200);
});

//close listen when clicking out
document.addEventListener("click", (e) => {
    if (!e.target.closest(".autocomplete-wrapper")) {
        renderSuggestions([]);
    }
});

// ------------------------------------------------------------
// PENDING RELATIONSHIP ARRAY MODIFICATION
// ------------------------------------------------------------

let nextPendingId = 0;
const pendingRelationships = new Map();

let selectedPerson = null;

function addPendingRelationship() {
    if (!selectedPerson) {
        alert("Pick person");
        return;
    }
    const id = nextPendingId++;
    pendingRelationships.set(id, {
        personId: selectedPerson.id,
        name: selectedPerson.name,
        type: relTypeSelect.value
    });

    renderPendingList();
    clearSelectedPerson();
    relPersonInput.value = "";
}

function removePendingRelationship(id) {
    pendingRelationships.delete(id);
    renderPendingList();
}

// Render entire list of pending relationships
function renderPendingList() {
    pendingList.innerHTML = "";
    pendingRelationships.forEach((rel, id) => {
        pendingList.appendChild(renderPendingRelationship(rel, id));
    });
}

// Render inidividual pending relationship
// Return rendered element
function renderPendingRelationship(rel, id) {
    const li = document.createElement("li");
    li.dataset.id = id;
    const label = document.createElement("span");
    label.textContent = `${rel.name} (${rel.type})`;
    //add removing

    li.appendChild(label);
    return li;
}

// ------------------------------------------------------------
// RELATIONSHIP MODIFICATION
// ------------------------------------------------------------

function addRelationshipTypeOption(t) {
    const option = document.createElement("option");
    option.value = t.key;
    option.textContent = t.label;
    return option;
}

async function loadRelationshipTypes() {
    try {
        const res = await fetch("/api/relationships/types");
        const types = await res.json();

        relTypeSelect.innerHTML = "";
        types.forEach(t => {
            relTypeSelect.appendChild(addRelationshipTypeOption(t));
        });
    } catch(e) {
        console.error("loadRelationshipTypes: ", e);
    }
}

async function createRelationship(newPerson, rel) {
    const res = await fetch("/api/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            sourceId: newPerson.id,
            targetId: rel.personId,
            type: rel.type
        })
    });

    if (!res.ok) {
        const body = await res.json();
        throw new Error("createRelationship: " + body.error);
    }
}

async function addRelationships(newPerson) {
    for (const rel of pendingRelationships.values()) {
        await createRelationship(newPerson, rel);
    }
}

// ------------------------------------------------------------
// PERSON MODIFICATION
// ------------------------------------------------------------

function getPersonFromData() {
    return {
        firstName: firstNameInput.value,
        lastName: lastNameInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        birthday: birthdayInput.value
    };
} 

// Create & add person to database
async function createPerson(personData) {
    const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personData)
    });

    const body = await res.json();
    if (!res.ok) {
        throw new Error("createPerson: " + body.error);
    }
    return body;
}

// Called by button: adds person & relationships, clears form
async function addPerson() {
    try {
        const newPerson = await createPerson(getPersonFromData());
        await addRelationships(newPerson);
        resetForm();
    } catch(e) {
        alert("addPerson: " + e.message);
    }
}

// ------------------------------------------------------------
// Resetting
// ------------------------------------------------------------

function clearInputFields() {
    firstNameInput.value = "";
    lastNameInput.value = "";
    emailInput.value = ""; 
    phoneInput.value = "";
    birthdayInput.value = "";
    relPersonInput.value = "";
}

function resetForm() {
    pendingRelationships.clear();
    renderPendingList();
    clearSelectedPerson();
    clearInputFields();
}


loadRelationshipTypes();