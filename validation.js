
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
   validateString (value, name, minLength, maxLength) {
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
  }
}
export default exportedMethods;