const PersonRepository = require("../../domain/person/PersonRepository");
const Person = require("../../domain/person/Person");
const db = require("../db/sqliteConnection.js");

class SqlitePersonRepository extends PersonRepository {
    save(person) {
        const result = db.prepare(
            "INSERT INTO people (first_name, last_name, group_name, email, phone, birthday) VALUES (?, ?, ?, ?, ?, ?)"
        ).run(person.firstName, person.lastName, person.group, person.email, person.phone, person.birthday || null);
        return result.lastInsertRowid;
    }

    findAll() {
        const rows = db.prepare(
            "SELECT * FROM people"
        ).all();
        //array.map(function(currentValue, index, arr), thisValue)
        return rows.map(r => new Person(r.id, r.first_name, r.last_name, r.group_name, r.email, r.phone, r.birthday));
    }
}
module.exports = SqlitePersonRepository;