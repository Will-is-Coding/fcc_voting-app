$(function() {
    //Use EJS instead? Faster?
    function updateVotes(poll) {
        for( var key in poll.options ) {
            $("." + key).text(poll.options[key]);
        }
    }
    var question = $(".question").text();
    $.ajax( {
            type: 'GET', url: '/fetchpolls', success: function(data) { console.log(data); }
        });
    $('form').on('submit', function(event) {
        event.preventDefault();
        var form = $(this);
        var pollData = new Object();
        
        pollData.vote = $("select option:selected").text();
        pollData.question = $(".question").text();
        pollData.options = [];
        $("option").each( function(index) {
            var option = { vote: $(this).text(), count: $("#" + $(this).text() + "-count").text() };
            pollData.options.push(option);
        });
        pollData = JSON.stringify(pollData);
        
        
        $.ajax( {
            type: "POST", url: "/poll", data: { poll: pollData }, 'content-type': 'application/json',
            success: function(data) { updateVotes(data); },
            error: function() {}
        });
        
    });
})