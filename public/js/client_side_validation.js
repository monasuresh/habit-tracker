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

async function deleteGroup(groupId, event) {
  try {
    event.preventDefault();  // Prevent the default behavior of the anchor link

    const response = await fetch(`/groups/delete-group/${groupId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      console.log('Group deleted successfully');
      location.reload();
    } else {
      console.error('Error deleting group:', response.statusText);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

async function deleteUser(userId, groupId, event) {
  try {
    event.preventDefault();  // Prevent the default behavior of the anchor link

    console.log('Exit from group with ID:', userId);

    const response = await fetch(`/groups/delete-user/${groupId}/${userId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      console.log('User deleted successfully');
      location.reload();
    } else {
      console.error('Error deleting User:', response.statusText);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

async function deleteIndividualChallenge(challengeId, event) {
  try {
    event.preventDefault();

    const response = await fetch(`/individual/delete-individual/${challengeId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      console.log('Group deleted successfully');
      location.reload();
    } else {
      console.error('Error deleting group:', response.statusText);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch user data from your MongoDB collection or server
    if (window.location.pathname === '/groups') {
      const response = await fetch('/users');
      const userData = await response.json();

      const selectElement = document.getElementById('userInput');

      userData.forEach(user => {
        const option = document.createElement('option');
        option.value = user._id;
        option.text = `${user.firstName} ${user.lastName}`;
        selectElement.add(option);
      });
    }
    if (window.location.pathname === '/groups' || window.location.pathname === '/individual') {
      const response_habit = await fetch('/habits/view-all');
      console.log("checking for habits:", response_habit);
      const habitsData = await response_habit.json();
      console.log(habitsData);

      const selectElementHabit = document.getElementById('habitInput');

      habitsData.forEach(habit => {
        const option = document.createElement('option');
        option.value = habit._id;
        option.text = `${habit.name}`;
        selectElementHabit.add(option);
      });
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
});

document.body.addEventListener('click', function (event) {
  const target = event.target;

  if (target.classList.contains('add-user-link')) {
    handleLinkClick(target);
  }

  if (target.classList.contains('submit-user-button')) {
    handleSubmitUserButtonClick(target);
  }
});

function handleAddUserLinkClick(link) {
  const groupId = extractIdFromElement(link, 'addUserLink_');
  const userDropdown = document.getElementById(`userDropdown_${groupId}`);
  userDropdown.classList.remove('hidden');
}

async function handleSubmitUserButtonClick(button) {
  const groupId = extractIdFromElement(button, 'submitUserButton_');
  const selectElement = document.getElementById(`userSelect_${groupId}`);
  const selectedUserId = selectElement.value;

  const groupIdInfo = document.getElementById(`groupid_${groupId}`);
  const groupidvalue = groupIdInfo.value;

  console.log('Selected User ID:', selectedUserId);

  try {
    const response = await fetch(`/groups/add-user/${selectedUserId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: selectedUserId,
        groupId: groupidvalue,
      }),
    });

    if (!response.ok) {
      console.error('Error adding user to group:', response.statusText);
      return;
    }

    const responseData = await response.json();
    console.log('Response data:', responseData);

    // Optionally, you can navigate to a new page or perform other actions based on the response
    // For example, you can navigate to the URL received in the response
    if (responseData && responseData.redirectUrl) {
      location.href = responseData.redirectUrl;
    }
  } catch (error) {
    console.error('Error performing POST request:', error);
  }

  // You can hide the dropdown after handling the selected user
  const userDropdown = document.getElementById(`userDropdown_${groupId}`);
  userDropdown.classList.add('hidden');
}

function extractIdFromElement(element, prefix) {
  const id = element.id;
  const prefixIndex = id.indexOf(prefix);
  return id.slice(prefixIndex + prefix.length);
}

async function fetchUserData() {
  try {
    const response = await fetch('/users');
    const userData = await response.json();
    console.log('Fetched user data:', userData);
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return [];
  }
}

// Populate dropdown function
function populateDropdown(groupId, userData) {
  const selectElement = document.getElementById(`userSelect_${groupId}`);
  console.log("Select element", selectElement)

  // Clear existing options
  selectElement.innerHTML = '';

  // Create an option for each user and append it to the select element
  userData.forEach(user => {
    const option = document.createElement('option');
    option.value = user._id; // Set the value to the user's unique identifier
    option.text = `${user.firstName} ${user.lastName}`;
    console.log(option.value);
    selectElement.add(option);
  });
}

// Call fetchUserData and populateDropdown in your handleLinkClick function
function handleLinkClick(link) {
  const groupId = extractIdFromElement(link, 'addUserLink_');

  // Fetch user data
  fetchUserData().then(userData => {
    // Populate the dropdown with user options
    populateDropdown(groupId, userData);

    // Show the dropdown
    showDropdown(groupId);
  });
}

// Show dropdown function
function showDropdown(groupId) {
  const userDropdown = document.getElementById(`userDropdown_${groupId}`);
  userDropdown.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', async function () {
  try {
    // Fetch group data from your server
    const response = await fetch('/groups/groups-all');
    const groupData = await response.json();

    // Iterate over each group and create a bar chart
    groupData.forEach(group => {
      // Create a container div for each group
      const groupContainer = document.createElement('div');
      groupContainer.className = 'group-container';

      // Get the canvas element for the chart
      const canvasId = `barChart_${group.groupId}`;
      const ctx = document.getElementById(canvasId).getContext('2d');

      const labels = group.users.map(user => `User ${user.userName}`);
      const scores = group.users.map(user => user.userScore);

      const chartData = {
        labels: labels,
        datasets: [{
          label: 'Scores',
          data: scores,
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
          ],
          borderWidth: 1,
        }],
      };

      // Create a new Chart.js instance for each chart
      const myBarChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        title: 'Group CHart',
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          plugins: {
            legend: {
              display: false, // Hide legend
            },
          },
          animation: {
            onComplete: function () {
              const chartInstance = this.chart;
              const ctx = chartInstance.ctx;
              const fontColor = 'black';
              ctx.font = Chart.helpers.fontString(14, 'normal', Chart.defaults.font.family);
              ctx.textAlign = 'center';

              group.users.forEach((user, index) => {
                const text = `${user.userName}`;
                const textX = chartInstance.scales.x.getPixelForValue(index);
                const textY = chartInstance.scales.y.getPixelForValue(user.userScore) - 5;
                ctx.fillStyle = fontColor;
                ctx.fillText(text, textX, textY);
              });
            }
          },
        },
      });

      // Display winner's name above the chart using an external label
      const winnerLabel = document.createElement('div');
      winnerLabel.innerHTML = `<strong>Winner: ${group.groupName} - ${group.winner.userName}</strong>`;
      winnerLabel.style.textAlign = 'center';
      winnerLabel.style.marginTop = '10px';
      groupContainer.appendChild(winnerLabel);
      groupContainer.appendChild(document.getElementById(canvasId).parentNode);

      // Append the container to the document body or another suitable parent element
      document.body.appendChild(groupContainer);
    });
  } catch (error) {
    console.error('Error fetching group data:', error);
  }
});
