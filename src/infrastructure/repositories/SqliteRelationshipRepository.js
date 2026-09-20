const RelationshipRepository = require("../../domain/relationship/RelationshipRepository");
const Relationship = require("../../domain/relationship/Relationship");

class SqlitePersonRepository extends RelationshipRepository {
    save(relationship) {

    }

    findAll() {
        const rows = db.prepare(
            "SELECT * FROM relationships"
        ).all();
        return rows.map(r => new Relationship(r.id, r.source_id, r.target_id, r.type));
    }
}

module.exports = SqlitePersonRepository;