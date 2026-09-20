class Relationship {
    constructor(id, sourceId, targetId, type) {
        if (!sourceId || !targetId) {
            throw new Error("Missing source/target id");
        }
        if (sourceId == targetId) {
            throw new Error("Can't link person to themseleves");
        }
        this.id = id;
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.type = type;
    }
}

module.exports = Relationship;