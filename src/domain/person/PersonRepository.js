//interface alternative. 
class PersonRepository {
    save(person) {
        throw Error("Empty");
    }
    search(query, limit) {
        throw Error("Empty");
    }
    findAll() {
        throw Error("Empty");
    }
}
module.exports = PersonRepository;