let habitLogData = [];

function displayHabitEntries(date) {
    const habitLog = document.getElementById('habitLog');
    habitLog.innerHTML = '';

    const filteredEntries = habitLogData.filter(entry => entry.dateTime.startsWith(date));

    if (filteredEntries.length === 0) {
        habitLog.innerHTML = '<p>No entries for the selected date.</p>';
    } else {
        const ul = document.createElement('ul');
        ul.className = 'list-group';

        filteredEntries.forEach(entry => {
            const li = document.createElement('li');
            li.className = 'list-group-item';

            const dateTime = new Date(entry.dateTime);
            const formattedDate = dateTime.toLocaleDateString();
            const formattedTime = dateTime.toLocaleTimeString();

            li.innerHTML = `Name: ${entry.name}<br>Date: ${formattedDate}<br>Time: ${formattedTime}`;

            ul.appendChild(li);
        });

        habitLog.appendChild(ul);
    }
}

const datePicker = document.getElementById('datePicker');
datePicker.addEventListener('change', function () {
    let isError = false;
    const selectedDate = this.value;

    let date = isValidHyphenSeparatedDate(selectedDate);

     // Check if the input is not empty
    if (typeof date !== 'string') {
        isError = true;
        displayHabitLogError('The date must be a string.');
    }

    date = date.trim();

    if (!date) {
        isError = true;
        displayHabitLogError('The date cannot be an empty string or a string with just spaces.');
    }

    // Regular expression to match YYYY-MM-DD format
    var dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(date)) {
        isError = true;
        displayHabitLogError('The date is invalid.');
    }

    // Parse the date using the Date object to check for validity
    var parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
        isError = true;
        displayHabitLogError('The date is invalid.');
    }

    displayHabitEntries(date);
});

const habitForm = document.getElementById('habitForm');
habitForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const habitInput = document.getElementById('habitInput');
    const dateInput = document.getElementById('dateInput');
    const timeInput = document.getElementById('timeInput');

    const name = habitInput.value;
    const date = dateInput.value;
    const time = timeInput.value;
    let validHabitLogParams = validateHabitLogParams(name, date, time);

    if (validHabitLogParams.isError === false) {
        addHabitEntry(validHabitLogParams);
    } else {
        return;
    }

    // Clear form inputs
    habitInput.value = '';
    dateInput.value = '';
    timeInput.value = '';
});

function displayHabitLogError(message) {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';

    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

function addHabitEntry() {
    const habitInput = document.getElementById('habitInput');
    const dateInput = document.getElementById('dateInput');
    const timeInput = document.getElementById('timeInput');

    // Log the input values for debugging
    console.log('Habit:', habitInput.value);
    console.log('Date:', dateInput.value);
    console.log('Time:', timeInput.value);

    const name = habitInput.value.trim();
    const date = dateInput.value.trim();
    const time = timeInput.value.trim();
    const emailAddress = localStorage.getItem('emailAddress').trim();

    // Log the trimmed values
    console.log(`Trimmed Habit Name: ${name}`);
    console.log(`Trimmed Date: ${date}`);
    console.log(`Trimmed Time: ${time}`);
    console.log(`Email Address from Storage: ${emailAddress}`);

    const habitLogEntry = {
        habitNameInput: name,
        dateInput: date, // local date
        timeInput: time, // local time
        timestamp: new Date(`${date}T${time}`).toISOString() // UTC timestamp
    };
    

    // Log the habit log entry object to be sent
    console.log('Habit Log Entry:', habitLogEntry);

    // AJAX request to log the habit
    $.ajax({
        type: 'POST',
        url: '/habits/log-habit',
        contentType: 'application/json',
        data: JSON.stringify({
            emailAddress: emailAddress,
            ...habitLogEntry,
        }),
        success: function (response) {
            console.log('Habit entry added successfully:', response);
            // Update the UI here if necessary
        },
        error: function (xhr, status, error) {
            console.error('Error adding habit entry:', error);
        },
    });
}

function populateHabitLogData() {
    $.ajax({
        type: 'GET',
        url: '/habits/log-habit',
    }).then(
        function (response) {
            // Success callback
            habitLogData.length = 0; // Clear existing data

            for (let item of response) {
                const dateTime = `${item.date}T${item.time}`;
                const name = item.trackedHabitName;
                habitLogData.push({ name, dateTime });
            }

            const today = new Date().toISOString().split('T')[0];
            displayHabitEntries(today);
        },
        function (xhr, status, error) {
            let errorMessage = jqXHR.responseJSON.error;
            displayHabitLogError(errorMessage);
        }
    );
}

function validateHabitLogParams(name, date, time) {
    let isError = false;
    
    if (!name || !date || !time) {
        displayHabitLogError('One or more fields were not supplied.');
        isError = true;
    }

    if (typeof name !== 'string') {
        displayHabitLogError('The tracked habit name must be of type string');
        isError = true;
    }

    name = name.trim();

    if (name.length === 0) {
        displayHabitLogError('The tracked habit name must not be a string with just empty spaces.');
        isError = true;
    }

    
    date = isValidHyphenSeparatedDate(date);

    time = isValidTime24HourFormat(time);

    let dateTimeInput = new Date(date + 'T' + time);
    let currentDateTime = new Date();

    if (dateTimeInput > currentDateTime) {
        displayHabitLogError('The date/time logged must be not after the current date/time.');
        isError = true;
    }

    return {name, date, time, isError};
}

function isValidHyphenSeparatedDate(dateInput) {
    // Check if the input is not empty
    if (typeof dateInput !== 'string') {
        displayHabitLogError('The date must be a string.');
    }

    dateInput = dateInput.trim();

    if (!dateInput) {
        displayHabitLogError('The date cannot be an empty string or a string with just spaces.');
    }

    // Regular expression to match YYYY-MM-DD format
    var dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(dateInput)) {
        displayHabitLogError('The date is invalid.');
    }

    // Parse the date using the Date object to check for validity
    var parsedDate = new Date(dateInput);
    if (isNaN(parsedDate.getTime())) {
        displayHabitLogError('The date is invalid.');
    }

    return dateInput;
}

function isValidTime24HourFormat(timeInput) {
    if (typeof timeInput !== 'string') {
        displayHabitLogError('The time must be a string.');
    }

    timeInput = timeInput.trim();

    if (!timeInput) {
        displayHabitLogError('The time cannot be an empty string or a string with just spaces.');
    }

    const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

    if (!timeRegex.test(timeInput)) {
        displayHabitLogError('The time is invalid.');
    }

    return timeInput;
}


$(document).ready(function () {
    populateHabitLogData();
});