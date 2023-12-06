(function ($) {
    deleteHabitButton = $('#deleteHabit'),
    modifyHabitButton = $('#modifyHabit');

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
})(window.jQuery);