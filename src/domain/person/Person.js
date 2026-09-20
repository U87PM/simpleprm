class Person {
    //initialise instance
    constructor(id, firstName, lastName, group, email, phone, birthday) {
        if (!firstName || firstName.trim() === "") {
            //enforce having a name
            throw new Error("Missing first name");
        }
        if (email && !email.includes("@")) {
            throw new Error("Email not valid");
        }
        if (birthday && isNaN(Date.parse(birthday))) {
            throw new Error("DOB not valid date");
        }
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.group = group;
        this.email = email;
        this.phone = phone;
        this.birthday = birthday;
    }
}
module.exports = Person;