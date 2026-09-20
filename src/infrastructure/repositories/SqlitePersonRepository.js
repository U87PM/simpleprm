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

    search(query, limit) {
        //prep query, remove all (")
        var ftsQuery = query.replace(/"/g, "");
        ftsQuery = `"${ftsQuery}"*`;

        const rows = db.prepare(`
            SELECT people.*                                 -- return columns from the 'people' table only
            FROM people_fts                                 -- work with
            JOIN people ON people.id = people_fts.rowid     -- match rows from both on the id property. (A, [id), B]
            WHERE people_fts MATCH ?                        -- searches all indexed columns rather than smth like people_fts.name
            ORDER BY rank
            LIMIT ?
        `).all(ftsQuery, limit); //fills the placeholders (?)
        return rows.map(r => new Person(r.id, r.first_name, r.last_name, r.group_name, r.email, r.phone, r.birthday));
    }


    findAll() {
        const rows = db.prepare(
            "SELECT * FROM people"
        ).all();
        //array.map(function(currentValue, index, arr), thisValue)
        // calls function for every element & goes into new array
        return rows.map(r => new Person(r.id, r.first_name, r.last_name, r.group_name, r.email, r.phone, r.birthday));
    }
}
module.exports = SqlitePersonRepository;