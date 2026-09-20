class AddPerson {
    constructor(personRepository) {
        this.personRepository = personRepository;
    }

    execute({firstName, lastName, group, email, phone, birthday}) {
        const Person = require("../domain/person/Person");
        const person = new Person(undefined, firstName, lastName, group, email, phone, birthday);

        //save returns lastInsertRowId
        const id = this.personRepository.save(person);
        return {id, firstName, lastName, group, email, phone, birthday};
    }
}
module.exports = AddPerson;