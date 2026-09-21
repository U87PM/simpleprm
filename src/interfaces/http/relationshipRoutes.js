const app = require("express");
const router = app.Router();

const SqliteRelatioshipRepository = require("../../infrastructure/repositories/SqliteRelationshipRepository");
const SqlitePersonRepository = require("../../infrastructure/repositories/SqlitePersonRepository");

// const PersonRepository = require("../../domain/person/PersonRepository");

const AddRelationship = require("../../application/AddRelationship");
const ListRelationshipTypes = require("../../application/ListRelationshipTypes");

const relationshipRepository = new SqliteRelatioshipRepository();
const personRepository = new SqlitePersonRepository();

const addRelationship = new AddRelationship(relationshipRepository, personRepository);
const listRelationshipTypes = new ListRelationshipTypes();

router.get("/", (req, res) => {
    const relationships = relationshipRepository.findAll();
    res.json(relationships);
});

router.get("/types", (req, res) => {
    const types = listRelationshipTypes.execute();
    res.json(types);
});

router.post("/", (req, res) => {
    try {
        const result = addRelationship.execute(req.body);
        res.json(result);
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

module.exports = router;