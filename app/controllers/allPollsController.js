'use strict';
(function() {
    //Use angular router?
    angular.module('VotingApp').controller('AllPollsController', ['$http', '$log', '$scope', 'pollService', function($http, $log, $scope, pollService) {
        $scope.allPolls = [];
        $scope.loggedIn = false;
        $scope.username = "";
        $scope.userNewOption = "";
        $scope.voteMessages = [];
        var votedFor = '';
        
        var tempPollIndex = null;
        
        var getAllPolls = function(error, polls, username, loggedIn) {
            if( error )
                throw error;
            else {
                $scope.allPolls = polls;
                $scope.loggedIn = loggedIn;
                $scope.username = username;
            }
        };
        pollService.fetchAllPolls(getAllPolls);
        
        
        $scope.displayPoll = function(poll, id) {
            poll.displaying = !poll.displaying;
            
            if( $(id + " > svg").length === 0 ) {
                pollService.buildChart(poll, id);
            }
        };
        
        var handleVoteResponse = function(error, response) {
            if ( response && !error ) {
                $scope.allPolls[tempPollIndex].voteMessage.message = response.emssage;
                if( !response.submitted ) {
                    $scope.allPolls[tempPollIndex].voteMessage.error = true;
                }
                else {
                    $scope.allPolls[tempPollIndex].alreadyVoted = true;
                    $scope.allPolls[tempPollIndex].userVotedFor = votedFor;
                    console.log($scope.allPolls[tempPollIndex]);
                }
            }
            else {
                $scope.allPolls[tempPollIndex].voteMessage.error = true;
                $scope.allPolls[tempPollIndex].voteMessage.submitted = false;
                console.log(error);
            }
        };
        
        $scope.vote = function(poll, index) {
            tempPollIndex = index;
            votedFor = poll.userVote._id;
            console.log(poll.userVote);
            if( poll.userVote ) {
                pollService.submitVote(poll.userVote.vote, poll, poll.userVote._id, handleVoteResponse);
            }
            else {
                $scope.allPolls[tempPollIndex].voteMessage.error = true;
                $scope.allPolls[tempPollIndex].voteMessage.submitted = false;
                $scope.allPolls[tempPollIndex].voteMessage.message = "Vote value was not valid";
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
            $scope.allPolls[tempPollIndex].voteMessage = { submitted: response.submitted, message: response.message, error: !response.submitted };
            if( response.submitted ) {
                $scope.allPolls[tempPollIndex].options = response.options;
                $scope.allPolls[tempPollIndex].alreadyVoted = false;
                $scope.allPolls[tempPollIndex].userVote = $scope.allPolls[tempPollIndex].options[0];
                $scope.allPolls[tempPollIndex].voteMessage.submitted = false;
                $scope.allPolls[tempPollIndex].voteMessage.removed = true;
            }
        };
        
        $scope.removeVote = function(poll, index) {
            console.log(poll);
            tempPollIndex = index;
            pollService.removeVote(poll, handleRemoveVote);  
        };
        
        $scope.createPlaceholder = function(poll) {
            if( $scope.loggedIn && !poll.alreadyAdded )
                return 'Add an option';
            else if( $scope.loggedIn && poll.alreadyAdded )
                return "You've added an option already";
            else
                return "You must be signed in";
        };
        
        $scope.checkIfUnique = function(newOpt, pollIndex) {
            if( newOpt.text !== undefined ){
                if( $scope.allPolls[pollIndex].options.findIndex( option => option.vote.toLowerCase() === newOpt.text.toLowerCase() && option.vote.length === newOpt.text.length ) !== -1 )
                    newOpt.unique = false;
                else
                    newOpt.unique = true;
            }
            else
                newOpt.unique = true;
        };
        
        var handleAddOptionResponse = function(error, response) {
            if( error ) 
                throw error;
                
            console.log(response);
            $scope.allPolls[tempPollIndex].addOptResponse = {success: response.submitted, message: response.message};
            
            if( response.submitted ) {
                $scope.allPolls[tempPollIndex].options = response.options;
                $scope.allPolls[tempPollIndex].userVote = $scope.allPolls[tempPollIndex].options[0];
                $scope.userNewOption.text = "";
            }

        };
        
        $scope.addOption = function(newOpt, poll, pollIndex) {
            if( newOpt ) {
                tempPollIndex = pollIndex;
                pollService.addOption(newOpt, poll, "#chart-" + pollIndex, handleAddOptionResponse);
            }
            else {
                poll.addOptResponse.message = "Option must be at least one character long";
                poll.addOptResponse.submitted = false;
                poll.addError = true;
            }
        };
        
    }]);
})();