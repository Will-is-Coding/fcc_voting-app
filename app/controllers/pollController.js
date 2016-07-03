(function() {
    angular.module('VotingApp').controller('PollController', ['$scope', '$routeParams', 'pollService', 'userService', function($scope, $routeParams, pollService, userService) {
        $scope.loggedIn = false;
        $scope.username = "";
        $scope.voteMessage = "";
        var tempOptIndex = "";
        var chartID = "#single-chart";
        
        function setupPoll(err, poll) {
            $scope.poll = poll;
            $scope.poll.totalVotes = pollService.totalVotes($scope.poll);
            $scope.poll.url = 'https://fcc-voting-app-will-is-coding.c9users.io/#/poll/' + poll._id;
            $scope.userVote = $scope.poll.options[0];
            $scope.poll.submitted = false;
            
            var hasVoted = $scope.poll.voters.findIndex( voter => voter.username === $scope.username );
            if( hasVoted !== -1 )
                $scope.poll.alreadyVoted = true;
            else
                $scope.poll.alreadyVoted = false;
                
            pollService.buildChart($scope.poll.options, chartID, 3);
        }
        pollService.fetchPoll($routeParams.id, setupPoll);
        
        function checkUserStatus(error, username) {
            if(error)
                throw error;
            else if( username !== '' ) {
                $scope.loggedIn = true;
                $scope.username = username;
            }
        }
        userService.getUsername(checkUserStatus);
        
        var handleVoteResponse = function(error, response) {
            if ( response && !error ) {
                $scope.voteMessage = response;
                if( response.submitted ) {
                    $scope.poll.options[tempOptIndex].count += 0;
                    //update Poll's chart
                }
                else {
                    $scope.voteMessage.error = true;
                }
            }
            else {
                $scope.voteMessage.error = true;
                $scope.voteMessage.submitted = false;
                console.log(error);
            }
        };
        
        $scope.vote = function(poll) {
            tempOptIndex = poll.options.findIndex( option => option._id === $scope.userVote._id );
            pollService.submitVote($scope.userVote.vote, poll._id, $scope.userVote._id, handleVoteResponse);
        };
        
        $scope.addOption = function(newOpt, poll) {
            pollService.addOption(newOpt, poll);
        };
    
    }]);
})();