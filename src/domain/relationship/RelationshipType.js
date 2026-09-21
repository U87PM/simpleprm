class RelationshipType {
    constructor(key, label, color, bidirectional) {
        if (!key || key.trim() === "") {
            throw new Error("RelationshipType requires key");
        }

        this.key = key;
        this.label = label;
        this.color = color;
        this.bidirectional = bidirectional;
    }
}

module.exports = RelationshipType;