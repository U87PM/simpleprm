//listen for incoming HTTP requests about people
const app = require("express");

//router allows for mounting at "prefix" url. aka /api/people + /foo, 
// only router.get('/foo') is needed instead of /api/people/foo 
const router = app.Router();

const SqlitePersonRepository = require(
    "../../infrastructure/repositories/SqlitePersonRepository");
const AddPerson = require("../../application/AddPerson");

const personRepository = new SqlitePersonRepository();
const addPerson = new AddPerson(personRepository);

// Return all people in database
// Route GET /api/people
router.get("/", (req, res) => {
    const people = personRepository.findAll();
    // method is identical to res.send() when an object or array
    // is passed, however it may be used for explicit JSON conversion
    res.json(people);
});

// Add person to database
// Route POST /api/people
router.post("/", (req, res) => {
    try {
        const result = addPerson.execute(req.body);
        res.json(result);
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

module.exports = router;