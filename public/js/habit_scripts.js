(function ($) {
    deleteHabitButton = $('#deleteHabit'),
        modifyHabitButton = $('#modifyHabit'),
        deleteTrackedHabitButton = $('#deleteTrackedHabit');

    modifyHabitButton.on("click", function () {
        var habitId = $(this).data("habit-modify-id");

        $.ajax({
            type: "GET",
            url: "/habits/modify/" + habitId,
            error: function (error) {
                console.error("Error loading modification page:", error);
            }
        });
    });

    deleteHabitButton.on("click", function () {
        var habitId = $(this).data("habit-id");

        // Send AJAX request to delete habit
        $.ajax({
            type: "DELETE",
            url: "/habits/delete-habit/" + habitId,
            data: { habitId: habitId },
            success: function () {
                // Reload the page after successful deletion
                location.reload();
            },
            error: function (error) {
                console.error("Error deleting habit:", error);
            }
        });
    });

    deleteTrackedHabitButton.on("click", function () {
        var trackedHabitId = $(this).data("tracked-habit-id");

        // Send AJAX request to delete habit
        $.ajax({
            type: "DELETE",
            url: "/tracked-habits/delete/" + trackedHabitId,
            error: function (error) {
                console.error("Error deleting habit:", error);
            }
        });
    });
})(window.jQuery);