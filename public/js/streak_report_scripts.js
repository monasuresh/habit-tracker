$(document).ready(function() {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');

    if (userId) {
        console.log("UserID:", userId);

        // Make AJAX call to fetch streak report data
        $.ajax({
            url: '/habits/streakReport/' + userId,
            type: 'GET',
            success: function(streakReport) {
                console.log("Streak Report Data:", streakReport);
                var source = $('#streak-report-template').html();
                var template = Handlebars.compile(source);
                var html = template(streakReport);
                $('#streak-report-container').html(html);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Error fetching streak report:', textStatus, errorThrown);
                alert('Error fetching streak report. Please check the console for more information.');
            }
        });
    } else {
        console.error('UserId not found in URL');
        alert('UserId is required to fetch the streak report.');
    }
});
