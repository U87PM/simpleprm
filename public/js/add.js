
function addPerson() {
    fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({
            firstName: document.getElementById("firstName").value,
            lastName: document.getElementById("lastName").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            birthday: document.getElementById("birthday").value
        })
    });
}