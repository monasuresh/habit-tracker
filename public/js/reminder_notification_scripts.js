let trackedHabitsList;

async function fetchReminderTimes() {
    try {
        reminderTime = data.reminderTime;
    } catch (error) {
        console.error('Error fetching reminder time:', error);
    }
}

function checkReminder() {
    const currentTime = Date.now();
    if (currentTime >= reminderTime) {
        // Create a message string and add habits user hasn't completed to the string
        showNotification('Time to complete your habit!');
    }
}

function showNotification(message) {
    console.log('Requesting notification permission...');
    Notification.requestPermission().then(permission => {
      console.log('Permission:', permission);
      if (permission === 'granted') {
        const notification = new Notification("Reminder", { 
            body: message, 
        })
      }
    })
  }
  
fetchReminderTimes();

setInterval(() => {
    fetchReminderTimes();
    checkReminder();
}, 60 * 1000);
