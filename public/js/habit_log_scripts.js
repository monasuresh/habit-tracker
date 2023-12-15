const habitLogData = [];

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
    const selectedDate = this.value;
    displayHabitEntries(selectedDate);
});

const habitForm = document.getElementById('habitForm');
habitForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const habitInput = document.getElementById('habitInput');
    const dateInput = document.getElementById('dateInput');
    const timeInput = document.getElementById('timeInput');
    const habit = habitInput.value;
    const date = dateInput.value;
    const time = timeInput.value;

    addHabitEntry();

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

    const name = habitInput.value;
    const date = dateInput.value;
    const time = timeInput.value;

    // Make an AJAX POST request
    $.ajax({
        type: 'POST',
        url: '/habits/log-habit',
        contentType: 'application/json',
        data: JSON.stringify({
            habitNameInput: name,
            dateInput: date,
            timeInput: time,
        }),
        success: function (response) {
            console.log('Habit entry added successfully:', response);
            const dateTime = `${date}T${time}`;
            habitLogData.push({ name, dateTime });

            datePicker.value = date;

            const changeEvent = new Event('change');
            datePicker.dispatchEvent(changeEvent);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            // Handle error response
            let errorMessage = jqXHR.responseJSON.error;
            displayHabitLogError(errorMessage);
        },
    });
}

function populateHabitLogData() {
    // Make an AJAX GET request to retrieve habit log entries
    $.ajax({
        type: 'GET',
        url: '/habits/log-habit',
        success: function (response) {
            habitLogData.length = 0; // Clear existing data

            for (let item of response) {
                const dateTime = `${item.date}T${item.time}`;
                const name = item.trackedHabitName;
                habitLogData.push({ name, dateTime });
            }

            const today = new Date().toISOString().split('T')[0];
            displayHabitEntries(today);
        },
        error: function (xhr, status, error) {
            console.error('Error retrieving habit log entries:', error);
        },
    });
}

$(document).ready(function () {
    populateHabitLogData();
});