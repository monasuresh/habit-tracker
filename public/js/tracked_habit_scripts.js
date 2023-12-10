function toggleReminderInput(index) {
    var trackedHabitCheckBox = document.getElementById("trackedHabitCheckBoxInput_" + index);
    var reminderInput = document.getElementById("reminderTimeInput_" + index);
    var trackingInput = document.getElementById("trackingInput_" + index);

    if (trackedHabitCheckBox.checked) {
        reminderInput.classList.remove("hidden");
        trackingInput.value = "true";
    } else {
        reminderInput.classList.add("hidden");
        trackingInput.value = "false";
    }
}