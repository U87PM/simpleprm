class ListRelationshipTypes {
    execute() {
        const RelationshipTypes = require("../domain/relationship/RelationshipTypes");
        const types = RelationshipTypes.getRelationshipTypes();
        return types.map(t => ({
            key: t.key,
            label: t.label,
            color: t.color,
            bidirectional: t.bidirectional
        }));
    }
}

module.exports = ListRelationshipTypes;