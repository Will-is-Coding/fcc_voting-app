(function() {
    //TODO: Move chart creation into separate service
    angular.module('VotingApp').controller('PollController', ['$scope', 'pollService', function($scope, pollService) {
        var controller = this;
        this.myVote = {};
        
        
        /**On load get the specific poll's data **/
        pollService.fetchPoll( function(poll) {
          controller.poll = poll;
          controller.myVote = poll.options[0];
        });

        /** Save the user's vote to the specificed poll **/
        this.addVote = function(userVote) {
            pollService.submitVote(userVote, function(submitted, message) {
              if( submitted )
                userVote.count += 1;
            });
        };
        
    }]);
})();