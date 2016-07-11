(function() {
    angular.module('VotingApp').controller('PollController', ['$scope', '$routeParams', 'pollService', 'userService', function($scope, $routeParams, pollService, userService) {
        $scope.loggedIn = false;
        $scope.username = "";
        $scope.voteMessage = "";
        $scope.addMessage = "";
        $scope.addError = false;
        
        var chartID = "#single-chart";
        var votedFor = "";
        
            
        var getPoll = function(error, poll, username, loggedIn) {
            if( error )
                throw error;
            
            $scope.poll = poll;
            pollService.buildChart(poll, chartID);
            $scope.loggedIn = loggedIn;
            $scope.username = username;
        };
        pollService.fetchPoll($routeParams.id, getPoll);
        
        
        var handleVoteResponse = function(error, response) {
            if ( response && !error ) {
                $scope.voteMessage = response;
                if( !response.submitted ) {
                    $scope.poll.voteMessage.error = true;
                }
                else {
                    $scope.poll.alreadyVoted = true;
                    $scope.poll.userVotedFor = votedFor;
                    $scope.poll.options = response.options;
                    $scope.poll.userVote = $scope.poll.options[0];
                }
            }
            else {
                $scope.voteMessage.error = true;
                $scope.voteMessage.submitted = false;
                console.log(error);
            }
        };
        
        $scope.vote = function() {
            votedFor = $scope.userVote._id;
            if( $scope.poll.userVote )
                pollService.submitVote($scope.userVote.vote, $scope.poll, $scope.userVote._id, handleVoteResponse);
            else {
                $scope.poll.voteMessage.error = true;
                $scope.poll.voteMessage.submitted = false;
                $scope.poll.voteMessage.message = "Vote value was not valid";
            }
        };
        
        
        var handleRemoveVote = function(err, response) {
            console.log(response);
            if(err) {
                throw err;
            }
            if( response.err ) {
                throw response.err;
            }
            $scope.poll.voteMessage = { submitted: response.submitted, message: response.message, error: !response.submitted };
            if( response.submitted ) {
                $scope.poll.options = response.options;
                $scope.poll.alreadyVoted = false;
                $scope.poll.userVote = $scope.poll.options[0];
                $scope.poll.voteMessage.submitted = false;
                $scope.poll.voteMessage.removed = true;
            }
        };
        
        $scope.removeVote = function(poll, index) {
            console.log(poll.userVotedFor);
            pollService.removeVote(poll, handleRemoveVote);  
        };
        
        
        var handleAddOptionResponse = function(error, response) {
            if( error ) {
                $scope.addError = true;
                throw error;
            }
            if( response.err ) {
                $scope.addError = true;
                throw response.err;
            }
            $scope.poll.voteMessage = { submitted: response.submitted, message: response.message, error: !response.submitted };
            if( response.submitted ) {
                $scope.addError = false;
                $scope.poll.options = response.options;
                $scope.poll.userVote = $scope.poll.options[0];
                $scope.poll.alreadyAdded = true;
                $scope.poll.userAddedOptionID = $scope.poll.options[response.options.length - 1]._id;
            }
            else {
                $scope.addError = true;
            }
        };
        
        $scope.addOption = function(newOpt, poll) {
            if(newOpt) {
                pollService.addOption(newOpt, poll, handleAddOptionResponse);
            }
            else {
                $scope.poll.addOptResponse.message = "Option must be at least one character long";
                $scope.poll.addOptResponse.submitted = false;
                $scope.addError = true;
            }
        };
        
        
        var handleRemoveOptionResponse = function(error, response) {
            console.log(response);
            if( error )
                throw error;
                
            if( response.error ) 
                throw response.error;
                
            $scope.poll.removeOptResponse = {success: response.submitted, message: response.message};
            
            if( response.submitted ) {
                $scope.poll.options = response.options;
                $scope.poll.voters = response.voters;
                //remove alreadyVoted & votedFor from voters
                $scope.poll.userVote = $scope.poll.options[0];
                $scope.poll.alreadyAdded = false;
            }
        };
        
        $scope.removeOption = function() {

              if( $scope.poll.userAddedOptionID && $scope.poll.options.length > 2 && $scope.poll.alreadyAdded ) {
                    var userAddedOptionVote = $scope.poll.options.findIndex( option => option._id === $scope.poll.userAddedOptionID );
                    userAddedOptionVote = $scope.poll.options[userAddedOptionVote].vote;
                    
                    pollService.removeOption($scope.poll, handleRemoveOptionResponse);
              }
        };
    
    }]);
})();