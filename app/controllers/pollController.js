(function() {
    //TODO: Move chart creation into separate service
    angular.module('VotingApp').controller('PollController', ['$scope', '$routeParams', 'pollService', 'userService', function($scope, $routeParams, pollService, userService) {
        $scope.loggedIn = false;
        var chartID = "#single-chart";
        
        function setupPoll(err, poll) {
            $scope.poll = poll;
            $scope.poll.totalVotes = pollService.totalVotes($scope.poll);
            $scope.userVote = $scope.poll.options[0];
            pollService.buildChart($scope.poll.options, chartID, 3);
        }
        
        pollService.fetchPoll($routeParams.id, setupPoll);
        
        function checkUserStatus() {
            if( userService.getUsername() === '' )
                $scope.loggedIn = false;
            else
                $scope.loggedIn = true;
        }
        checkUserStatus();
        
        $scope.vote = function(userVote, pollID) {
            pollService.submitVote(userVote, pollID);
        };
        
        $scope.addOption = function(newOpt, poll) {
            pollService.addOption(newOpt, poll);
        };
    
    }]);
})();