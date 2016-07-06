'use strict';
(function() {
    //Use angular router?
    angular.module('VotingApp').controller('AllPollsController', ['$http', '$log', '$scope', 'pollService', function($http, $log, $scope, pollService) {
        $scope.allPolls = [];
        $scope.loggedIn = false;
        $scope.username = "";
        $scope.userNewOption = "";
        $scope.voteMessages = [];
        
        var tempPollIndex = null;
        var addedVote = "";
    
        
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
                $scope.allPolls[tempPollIndex].voteMessage = response;
                if( !response.submitted ) {
                    $scope.allPolls[tempPollIndex].voteMessage.error = true;
                }
            }
            else {
                $scope.allPolls[tempPollIndex].voteMessage.error = true;
                $scope.allPolls[tempPollIndex].voteMessage.submitted = false;
                console.log(error);
            }
        };
        
        $scope.vote = function(poll, index) {
            console.log(poll.userVote);
            tempPollIndex = index;
            
            pollService.submitVote(poll.userVote.vote, poll, poll.userVote._id, handleVoteResponse);
        };
        
        
        $scope.checkIfUnique = function(newOpt, pollIndex) {
            console.log(newOpt.text);
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
            if( error ) {
                $scope.allPolls[tempPollIndex].addError = true;
                throw error;
            }
            
            if( response.submitted ) {
                $scope.allPolls[tempPollIndex].addError = false;
                $scope.allPolls[tempPollIndex].options.push({vote: addedVote, count: 0});
            }
            else {
                $scope.addError = true;
            }
            
            $scope.addMessage = response.message;
        };
        
        $scope.addOption = function(newOpt, poll, pollIndex) {
            addedVote = newOpt;
            tempPollIndex = pollIndex;
            pollService.addOption(newOpt, poll, "#chart-" + pollIndex, handleAddOptionResponse);
        };
        
    }]);
})();