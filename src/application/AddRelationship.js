class AddRelationship {
    constructor(relationshipRepository, personRepository) {
        this.relationshipRepository = relationshipRepository;
        this.personRepository = personRepository;
    }

    execute({sourceId, targetId, type}) {
        const Relationship = require("../domain/relationship/Relationship");
        
        const people = this.personRepository.findAll();
        //some returns true if it finds an element in the array that
        //satisfies the provided testing function, Array.some(callbackFn)
        //callbackFn(element, index, array) - element is current element (p below)
        const sourceExists = people.some(p => (p.id === Number(sourceId)));
        const targetExists = people.some(p => (p.id === Number(targetId)));
        if (!sourceExists || !targetExists) {
            throw new Error("Both people must exist");
        }

        const relationship = new Relationship(undefined, Number(sourceId), Number(targetId), type);
        const id = this.relationshipRepository.save(relationship);

        return {
            id:id, 
            sourceId: Number(sourceId), 
            targetId: Number(targetId),
            type: type
        };
    }
}

module.exports = AddRelationship;