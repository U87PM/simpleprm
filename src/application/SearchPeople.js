class SearchPeople {
    constructor(personRepository) {
        this.personRepository = personRepository;
    }

    execute({query}) {
        if (!query || query.trim() === "") {
            return [];
        }
        const MAX_RESULTS = 10;
        return this.personRepository.search(query.trim(), MAX_RESULTS);
    }
}

module.exports = SearchPeople;