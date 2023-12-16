let isFetchingData = false;
let trackedHabitsList;
let habitsList;
let habitLogsList;
let notificationMessage = '';

function fetchReminderTimes() {
    if (isFetchingData) {
        return;
    }

    isFetchingData = true;

    notificationMessage = ''; // Reset the notification message at the beginning

    const trackedHabitsPromise = $.ajax({
        type: 'GET',
        url: '/tracked-habits/get-all',
    });

    const habitsPromise = $.ajax({
        type: 'GET',
        url: '/habits/view-all',
    });

    const habitLogsPromise = $.ajax({
        type: 'GET',
        url: '/habits/log-habit',
    });

    // Wait for promises to resolve
    Promise.all([trackedHabitsPromise, habitsPromise, habitLogsPromise])
        .then(([trackedResponse, habitsResponse, habitLogsResponse]) => {
            trackedHabitsList = trackedResponse;
            habitsList = habitsResponse;
            habitLogsList = habitLogsResponse;

            // Call the function that depends on the data
            processReminderTimes();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        })
        .finally(() => {
            isFetchingData = false;
        });
}

function processReminderTimes() {
    for (let trackedHabit of trackedHabitsList) {
        let trackedHabitName;
        for (let habit of habitsList) {
            if (trackedHabit.habitId === habit._id) {
                trackedHabitName = habit.name;
            }
        }

        let currentDate = new Date();
        let year = currentDate.getFullYear();
        let month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        let day = currentDate.getDate().toString().padStart(2, '0');

        let formattedDate = `${year}-${month}-${day}`;

        let hasEntryForCurrentDate = false;

        for (let habitLog of habitLogsList) {
            if (habitLog.trackedHabitID == trackedHabit._id && habitLog.date == formattedDate) {
                hasEntryForCurrentDate = true;
                break;
            }
        }

        if (!hasEntryForCurrentDate) {
            checkReminder(trackedHabitName, trackedHabit.reminderTime);
        }
    }

    if (notificationMessage.length > 0) {
        showNotification('It is time to complete habits ' + notificationMessage);
    }
}

function checkReminder(trackedhabitName, reminderTime) {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const [reminderHours, reminderMinutes] = reminderTime.split(':').map(Number);

    // Check if the current time is equal to the reminder time
    if (currentHours === reminderHours && currentMinutes === reminderMinutes) {
        notificationMessage += trackedhabitName + ', ';
    } else {
        const timeDifferenceInMinutes = (currentHours * 60 + currentMinutes) - (reminderHours * 60 + reminderMinutes);
        if (timeDifferenceInMinutes >= 5 && timeDifferenceInMinutes % 5 === 0) {
            notificationMessage += trackedhabitName + ', ';
        }
    }
}

function showNotification(message) {
    console.log('Requesting notification permission...');
    Notification.requestPermission().then(permission => {
        console.log('Permission:', permission);
        if (permission === 'granted') {
            const notification = new Notification("Reminder", {
                body: message,
            });
        }
    });
}

fetchReminderTimes();

setInterval(fetchReminderTimes, 30 * 1000);