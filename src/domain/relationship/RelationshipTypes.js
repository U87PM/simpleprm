const RelationshipType = require("./RelationshipType");

const TYPES = [
    new RelationshipType("other", "Other", "#888888", true),
    new RelationshipType("friend", "Friend", "#ff0000", true),
    new RelationshipType("colleague", "Colleague", "#0000ff", true),
    new RelationshipType("parent", "Parent", "#ff00ff", false),
    new RelationshipType("child", "Child", "#ffff00", false),
    new RelationshipType("spouse", "Spouse", "#374984", true)
]

const TYPES_BY_KEY = new Map(TYPES.map(t => [t.key, t]));
const DEFAULT_TYPE = TYPES[0];

function getRelationshipType(key) {
    return TYPES_BY_KEY.get(key) || DEFAULT_TYPE;
}

function getRelationshipTypes() {
    return TYPES;
}
module.exports = {
    getRelationshipType,
    getRelationshipTypes,
    DEFAULT_TYPE
}