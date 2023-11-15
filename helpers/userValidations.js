function validateUserParams(firstname, lastname, username, password, emailAddress) {
    if (!firstname || !lastname || !username || !password || !emailAddress) {
        throw 'All fields need to have valid values.';
    }

    if (typeof firstname !== 'string' || typeof lastname !== 'string' || typeof username !== 'string' || typeof password !== 'string' || typeof emailAddress !== 'string') {
        throw 'All fields need to be of type string.';
    }

    firstname = firstname.trim();
    lastname = lastname.trim();
    username = username.trim();
    password = password.trim();
    emailAddress = emailAddress.trim();

    if (firstname.length === 0 || lastname.length === 0 || username.length === 0 || password.length === 0 || emailAddress.length === 0) {
        throw 'The fields must have characters other than spaces.';
    }

    const nameRegex = /^[A-Za-z0-9.' \-]+$/;

    if (!nameRegex.test(firstname)) {
        throw 'Invalid first name.';
    }

    if (!nameRegex.test(lastname)) {
        throw 'Invalid last name.';
    }

    const userNameRegex = /^[a-zA-Z0-9]([._-](?![._-])|[a-zA-Z0-9]){3,18}[a-zA-Z0-9]$/;

    if (!userNameRegex.test(username)) {
        throw 'Invalid username. The username must start with a letter a-z or A-Z or a digit 0-9. It can then be followed by any letter a-z or A-Z, any digit 0-9, a dot, underscore, or hyphen but not consecutively. It must be within 3 - 18 characters and must end with a letter or digit.';
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#&()–[\]{}:;',?/*~$^+=<>]).{8,20}$/;

    if (!passwordRegex.test(password)) {
        throw 'Invalid password. The password must contain At least one digit 0 - 9, at least one lowercase letter a-z, at least one uppercase letter A - Z, and at least one special character from the set !@#&()–[{}]:;\',?/*~$^+=<\>. The overall length must be between 8 and 20 characters.';
    }

    // Validate contactEmail format
    const emailRegex = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(emailAddress)) {
        throw "Invalid email format.";
    }

    return { firstname, lastname, username, password, emailAddress };
}

export default {
    validateUserParams
};