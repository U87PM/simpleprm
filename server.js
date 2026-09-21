const express = require("express");

const app = express();
app.use(express.json());

//static - delivered to client wout server modification (from the public folder)
app.use(express.static('public/pages'));
app.use('/js', express.static('public/js'));
app.use('/locales', express.static('public/locales'));

const peopleRoutes = require("./src/interfaces/http/peopleRoutes");
const relationshipRoutes = require("./src/interfaces/http/relationshipRoutes");

app.use("/api/people", peopleRoutes);
app.use("/api/relationships", relationshipRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    //A function called once the server is listening.
    console.log("Server active")
})

