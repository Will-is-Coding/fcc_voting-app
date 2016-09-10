(function() {
    'use strict';
    
    angular.module('VotingApp').controller('TruePollController', ['$http', '$scope', '$routeParams', 'pollService', function($http, $scope, $routeParams, pollService) {
        
        var votedFor = '';
        var tempPoll = null;
        $scope.loggedIn = false;
        
        
        var getPoll = function(error, poll, username, loggedIn) {
            if( error )
                throw error;

            $scope.poll = poll;
            pollService.buildChart(poll, "#single-chart");
            $scope.loggedIn = loggedIn;
            $scope.username = username;
        };
        
        var getAllPolls = function(error, polls, username, loggedIn) {
            if( error )
                throw error;
            else {
                $scope.allPolls = polls;
                $scope.loggedIn = loggedIn;
                $scope.username = username;
            }
        };
        
        
        $scope.getPolls = function() {
            if( $routeParams.id ) {
                pollService.fetchPoll($routeParams.id, getPoll);
            }
            else {
                pollService.fetchAllPolls(getAllPolls);
            }
        };
        $scope.getPolls();
    
        

        $scope.displayPoll = function(poll, id, index) {
            if( poll.displaying ) {
                $('#poll-' + index + ' > .panel-heading').removeClass('active-poll');
                poll.displaying = false;
            }
            else {
                 $('#poll-' + index + ' > .panel-heading').addClass('active-poll');
                poll.displaying = true;
            }

            if( $(id + " > svg").length === 0 ) {
                pollService.buildChart(poll, id);
            }
        };
        
        var handleVoteResponse = function(error, response) {

            if ( response && !error ) {
                tempPoll.voteMessage.message = response.emssage;
                if( !response.success ) {
                    tempPoll.voteMessage.error = true;
                }
                else {
                    tempPoll.alreadyVoted = true;
                    tempPoll.userVotedFor = votedFor;
                    tempPoll.options = response.options;
                    tempPoll.userVote = tempPoll.options[0];
                    tempPoll.totalVotes++;
                    console.log(tempPoll);
                }
            }
            else {
                tempPoll.voteMessage.error = true;
                tempPoll.voteMessage.submitted = false;
                console.log(error);
            }
        };
        
        $scope.vote = function(poll) {
            tempPoll = poll;
            votedFor = poll.userVote._id;
            console.log(poll.userVote);
            if( poll.userVote ) {
                
                pollService.submitVote(poll.userVote.vote, poll, poll.userVote._id, handleVoteResponse);
            }
            else {
                tempPoll.voteMessage.error = true;
                tempPoll.voteMessage.submitted = false;
                tempPoll.voteMessage.message = "Vote value was not valid";
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
            tempPoll.voteMessage = { submitted: response.success, message: response.message, error: !response.success };
            if( response.success ) {
                tempPoll.options = response.options;
                tempPoll.alreadyVoted = false;
                tempPoll.userVote = tempPoll.options[0];
                tempPoll.voteMessage.submitted = false;
                tempPoll.voteMessage.removed = true;
                tempPoll.totalVotes--;
            }
        };
        
        $scope.removeVote = function(poll) {
            console.log(poll);
            tempPoll = poll;
            console.log(poll.userVotedFor);
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
        
        $scope.checkIfUnique = function(newOpt, pollIndex, singlePoll) {
            if( newOpt.text !== undefined ){

                    if( (!singlePoll && $scope.allPolls[pollIndex].options.findIndex( option => option.vote.toLowerCase() === newOpt.text.toLowerCase() && option.vote.length === newOpt.text.length ) !== -1 )
                    || (singlePoll && $scope.poll.options.findIndex( option => option.vote.toLowerCase() === newOpt.text.toLowerCase() && option.vote.length === newOpt.text.length ) !== -1  ))
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
            if( response.error )
                throw response.error;
                
            console.log(response);
            tempPoll.addOptResponse = {submitted: response.success, message: response.message};
            
            if( response.success ) {
                tempPoll.removeOptResponse = {submitted: false, message: ''};
                tempPoll.options = response.options;
                tempPoll.userVote = tempPoll.options[0];
                tempPoll.alreadyAdded = true;
                tempPoll.userAddedOptionID = tempPoll.options[response.options.length - 1]._id;
            }

        };
        
        
        $scope.addOption = function(newOpt, poll, chartID) {
            if( newOpt ) {
                console.log(newOpt);
                tempPoll = poll;
                pollService.addOption(newOpt, poll, chartID, handleAddOptionResponse);
            }
            else {
                poll.addOptResponse.message = "Option must be at least one character long";
                poll.addOptResponse.submitted = false;
                poll.addError = true;
            }
        };
        
        var handleRemoveOptionResponse = function(error, response) {
            console.log(response);
            if( error )
                throw error;
                
            if( response.error ) 
                throw response.error;
                
            tempPoll.removeOptResponse = {submitted: response.success, message: response.message};
            
            if( response.success ) {
                tempPoll.addOptResponse = {submitted: false, message: ''};
                tempPoll.options = response.options;
                tempPoll.voters = response.voters;

                tempPoll.userVote = tempPoll.options[0];
                tempPoll.alreadyAdded = false;
                if( tempPoll.alreadyVoted ) {
                    var optVotedForRemoved = tempPoll.options.findIndex( option => option._id === tempPoll.userVotedFor);
                    if( optVotedForRemoved === - 1) {
                        tempPoll.alreadyVoted = false;
                    }
                }
            }
        };
        
        $scope.removeOption = function(poll) {
            console.log(poll);
              if( poll.userAddedOptionID && poll.options.length > 2 && poll.alreadyAdded ) {
                    tempPoll = poll;
                    var userAddedOptionVote = poll.options.findIndex( option => option._id === poll.userAddedOptionID );
                    userAddedOptionVote = poll.options[userAddedOptionVote].vote;
                    
                    pollService.removeOption(poll, handleRemoveOptionResponse);
              }
        };
        
        $scope.displayMessage = function(text, bool, message) {
            if( text && bool )
                return true;
            else {
                message = '';
                bool = false;
                text = false;
                return false;
            }
        };
        
    }]);
})();