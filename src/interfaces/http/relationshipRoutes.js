const app = require("express");
const router = app.Router();

const SqliteRelatioshipRepository = require("../../infrastructure/repositories/SqliteRelationshipRepository");
const AddRelationship = require("../../application/AddRelationship");

const relationshipRepository = new SqliteRelatioshipRepository();
const addRelationship = new AddRelationship();

router.get("/", (req, res) => {
    const relationships = relationshipRepository.findAll();
    res.json(relationships);
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