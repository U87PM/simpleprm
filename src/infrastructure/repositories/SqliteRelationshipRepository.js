const RelationshipRepository = require("../../domain/relationship/RelationshipRepository");
const Relationship = require("../../domain/relationship/Relationship");
const db = require("../db/sqliteConnection");

class SqlitePersonRepository extends RelationshipRepository {
    save(r) {
        const result = db.prepare(
            "INSERT INTO relationships (source_id, target_id, type) VALUES (?, ?, ?)"
        ).run(r.sourceId, r.targetId, r.type);
    }

    findAll() {
        const rows = db.prepare(
            "SELECT * FROM relationships"
        ).all();
        return rows.map(r => new Relationship(r.id, r.source_id, r.target_id, r.type));
    }
}

module.exports = SqlitePersonRepository;