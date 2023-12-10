// In this file, you must perform all client-side validation for every single form input (and the role dropdown) on your pages. The constraints for those fields are the same as they are for the data functions and routes. Using client-side JS, you will intercept the form's submit event when the form is submitted and If there is an error in the user's input or they are missing fields, you will not allow the form to submit to the server and will display an error on the page to the user informing them of what was incorrect or missing.  You must do this for ALL fields for the register form as well as the login form. If the form being submitted has all valid data, then you will allow it to submit to the server for processing. Don't forget to check that password and confirm password match on the registration form!
function validateRegisterForm(form) {
  displayError("");
  const firstName = form.querySelector('input[name="firstName"]');
  if (firstName.value.length < 2 || firstName.value.length > 25) {
    displayError("Invalid First Name. It should be a valid string with no empty spaces and at least 2 characters long and no longer than 25 characters long.");
    return false;
  }
  const lastName = form.querySelector('input[name="lastName"]');
  if (lastName.value.length < 2 || lastName.value.length > 25) {
    displayError("Invalid Last Name. It should be a valid string with no empty spaces and at least 2 characters long and no longer than 25 characters long.");
    return false;
  }
  const emailAddress = form.querySelector('input[name="emailAddress"]');
  if (!isEmailValid(emailAddress.value)) {
    displayError("Please enter a valid Email address");
    return false;
  }
  //var roleSelect = form.querySelector('select[id="roles"]');
  // Get the selected value
  //var selectedRole = roleSelect.value;
  //if (selectedRole==="") {
  //    displayError("Please select a role for the user.");
  //    return false;
  //}
  const password = form.querySelector('input[name="userPassword"]').value.trim();
  if (typeof password !== 'string' || password.trim().length === 0 || password.length < 8) {
    displayError("Invalid password. It should be a valid string with no empty spaces and at least 8 characters long.");
    return false;
  }

  // Check for at least one uppercase character
  if (!/[A-Z]/.test(password)) {
    displayError("Invalid password. It should contain at least one uppercase character.");
    return false;
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    displayError("Invalid password. It should contain at least one number.");
    return false;
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password)) {
    displayError("Invalid password. It should contain at least one special character.");
    return false;
  }
  const password2 = form.querySelector('input[name="userPassword2"]').value.trim();
  if (typeof password2 !== 'string' || password2.trim().length === 0 || password2.length < 8) {
    displayError("Invalid re-entered password. It should be a valid string with no empty spaces and at least 8 characters long.");
    return false;
  }

  // Check for at least one uppercase character
  if (!/[A-Z]/.test(password2)) {
    displayError("Invalid re-entered password. It should contain at least one uppercase character.");
    return false;
  }

  // Check for at least one number
  if (!/\d/.test(password2)) {
    displayError("Invalid re-entered password. It should contain at least one number.");
    return false;
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password2)) {
    displayError("Invalid re-entered password. It should contain at least one special character.");
    return false;
  }
  if (password != password2) {
    displayError("The two passwords you have entered do not match.");
    return false;
  }
  return true;
}
function validateLoginForm(form) {
  displayError("");

  const emailAddress = form.querySelector('input[name="emailAddress"]');
  if (!isEmailValid(emailAddress.value)) {
    displayError("Please enter a valid Email address");
    return false;
  }
  const password = form.querySelector('input[name="userPassword"]').value.trim();
  if (typeof password !== 'string' || password.trim().length === 0 || password.length < 8) {
    displayError("Invalid password. It should be a valid string with no empty spaces and at least 8 characters long.");
    return false;
  }

  // Check for at least one uppercase character
  if (!/[A-Z]/.test(password)) {
    displayError("Invalid password. It should contain at least one uppercase character.");
    return false;
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    displayError("Invalid password. It should contain at least one number.");
    return false;
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password)) {
    displayError("Invalid password. It should contain at least one special character.");
    return false;
  }
  return true;
}

// Function to display an error message
function displayError(message) {
  document.getElementById('error').innerHTML = message;
}
function isEmailValid(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function showPass(fieldName) {
  var x = document.getElementById(fieldName);
  if (x.type === "password") {
    x.type = "text";
  } else {
    x.type = "password";
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch user data from your MongoDB collection or server
    console.log("I am fetching users data");
    const response = await fetch('/users'); // Replace with your actual endpoint
    const userData = await response.json();
    console.log("I am client side ----------------");
    console.log(userData);

    // Get the select element
    const selectElement = document.getElementById('userInput');

    // Create an option for each user and append it to the select element
    userData.forEach(user => {
      const option = document.createElement('option');
      option.value = user._id; // Set the value to the user's unique identifier
      option.text = `${user.firstName} ${user.lastName}`;
      selectElement.add(option);
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
});
