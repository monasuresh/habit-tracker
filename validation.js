import moment from 'moment';
import { ObjectId } from 'mongodb';
import { users } from './config/mongoCollections.js';

const exportedMethods = {
  checkId(id, varName) {
    if (!id) throw `Error: You must provide a ${varName}`;
    if (typeof id !== 'string') throw `Error:${varName} must be a string`;
    id = id.trim();
    if (id.length === 0)
      throw `Error: ${varName} cannot be an empty string or just spaces`;

    return id;
  },
  isEmailValid(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Helper function to validate a valid time in 12-hour AM/PM format
  isTimeValid(time) {
    return moment(time, 'h:mmA', true).isValid()
  },

  // Helper function to validate a valid date in "MM/DD/YYYY" format
  isDateValid(date) {
    return moment(date, 'MM/DD/YYYY', true).isValid()
  },

  // Helper function to validate a valid state abbreviation
  isStateValid(state) {
    return /^[A-Za-z]{2}$/.test(state)
  },

  // Helper function to validate a valid zip code (5 digits)
  isZipValid(zip) {
    return /^\d{5}$/.test(zip)
  },

  // Trim and validate string inputs
  validateString(value, name, minLength, maxLength) {
    const trimmedValue = value.trim();
    if (trimmedValue.length < minLength) {
      throw `${name} should be at least ${minLength} characters long`;
    }
    if (trimmedValue.length > maxLength) {
      throw `${name} should not be more than ${maxLength} characters long`;
    }
    return trimmedValue;
  },
  //validate password
  validatePassword(password) {
    // Check for a valid string with no empty spaces and a minimum length of 8 characters
    if (typeof password !== 'string' || password.trim().length === 0 || password.length < 8) {
      throw 'Invalid password. It should be a valid string with no empty spaces and at least 8 characters long.';
    }

    // Check for at least one uppercase character
    if (!/[A-Z]/.test(password)) {
      throw 'Invalid password. It should contain at least one uppercase character.';
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      throw 'Invalid password. It should contain at least one number.';
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password)) {
      throw 'Invalid password. It should contain at least one special character.';
    }
    return password;
  },

  isValidHyphenSeparatedDate(dateInput) {
    // Check if the input is not empty
    if (typeof dateInput !== 'string') {
      throw 'The date must be a string.';
    }

    dateInput = dateInput.trim();

    if (!dateInput) {
      throw 'The date cannot be an empty string or a string with just spaces.';
    }

    if (!moment(dateInput, 'YYYY-MM-DD', true).isValid()) {
      throw 'The date is invalid.'
    }

    return dateInput;
  },

  isValidTime24HourFormat(timeInput) {
    if (typeof timeInput !== 'string') {
      throw 'The time must be a string.';
    }

    timeInput = timeInput.trim();

    if (!timeInput) {
      throw 'The time cannot be an empty string or a string with just spaces.';
    }

    const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

    if (!timeRegex.test(timeInput)) {
      throw 'The time is invalid.';
    }

    return timeInput;
  },

  validateHabitParams(name, effect, category, weight, hasOptionalParams) {
    // Habit name must start and end with alpha-numeric characters and be between 3 and 50 characters long
    if (hasOptionalParams === false) {
      if (!name || !effect || !category || !weight) {
        throw 'All fields need to be provided';
      }
    }
    
    if ((name && typeof name !== 'string') || (effect && typeof effect !== 'string') || (category && typeof category !== 'string') || (weight && typeof weight !== 'string')) {
      throw 'Either the habit name, effect or category is not of type string. Those fields must be strings.';
    }

    if (name) {
      name = name.trim();
    }

    if (effect) {
      effect = effect.trim();
    }

    if (category) {
      category = category.trim().toLowerCase();
    }

    if (weight) {
      weight = weight.trim();
    }

    if ((name && name.length === 0) || (effect && effect.length === 0) || (category && category.length === 0) || (weight && weight.length === 0)) {
      throw 'The name, effect, category, and weight must not be an empty string or a string with just spaces.';
    }

    if (weight && !Number.isInteger(parseFloat(weight))) {
      throw 'The weight must be an integer.';
    }

    if (weight) {
      weight = parseInt(weight, 10);
    }

    if (weight && this.isNotValidNumber(weight)) {
      throw 'The weight is not of type number.';
    }

    if (weight && (!(weight >= 1 && weight <= 10) || !Number.isInteger(weight))) {
      throw 'The weight must be a positive, whole number between 1 and 10.';
    }

    const habitNameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9\s]{1,48}[a-zA-Z0-9])?$/;

    if (name && !habitNameRegex.test(name)) {
      throw 'The habit name must start and end with alphanumeric characters, must contain alphanumeric characters or spaces and be between 3 and 50 characters long';
    }

    const effectRegex = /^(good|bad)$/i;

    if (effect && !effectRegex.test(effect)) {
      throw 'The effect must either be good or bad';
    }

    const validCategories = [
      "healthAndFitness",
      "personalDevelopment",
      "productivity",
      "financial",
      "relationships",
      "careerDevelopment",
      "social",
      "organization",
      "hobbies"
    ];


    const validCategoriesString = `Valid Categories: ${validCategories.join(", ")}`;

    const categoryRegex = /^(healthAndFitness|personalDevelopment|productivity|financial|relationships|careerDevelopment|social|organization|hobbies)$/i;

    if (category && !categoryRegex.test(category)) {
      throw validCategoriesString;
    }

    return { name, effect, category, weight };
  },

  isNotValidNumber(num) {
    return typeof num !== 'number' || isNaN(num) || num === Infinity || num === -Infinity;
  },

  validateEmailAddress(emailAddress) {
    if (!emailAddress) throw 'A user email address was not provided.';

    if (typeof emailAddress !== 'string') {
        throw 'The email address must be of type string.';
    }

    emailAddress = emailAddress.trim().toLowerCase();

    if (emailAddress.length === 0) {
        throw 'The email address must not be empty or a string with just spaces.';
    }

    //const emailRegex = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

    if (!this.isEmailValid(emailAddress)) {
        throw 'Invalid email address.';
    }

    return emailAddress;
  },

  validateIdStrings(id) {
    if (!id) throw 'You must provide an id to search for';

    if (typeof id !== 'string') {
        throw 'The id is not of type string.';
    }

    id = id.trim();

    if (!ObjectId.isValid(id)) {
        throw 'The provided id is not an ObjectId.';
    }

    return id;
  },

  async checkIfEmailAddressExistsInDb(emailAddress) {
    let userCollection = await users();
    
    let foundUser = await userCollection.findOne({'emailAddress': emailAddress});

    if (!foundUser) {
      throw 'No user with the provided email address could be found.';
    }
  }
}
export default exportedMethods;