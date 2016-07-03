'use strict';
(function() {
    //Use angular router?
    angular.module('VotingApp').controller('AllPollsController', ['$http', '$log', '$scope', 'userService', 'pollService', function($http, $log, $scope, userService, pollService) {
        $scope.allPolls = [];
        $scope.loggedIn = false;
        $scope.username = "";
        $scope.userNewOption = "";
        $scope.voteMessages = [];
        var tempPollIndex = null;
        var tempOptIndex = null;
        //$scope.userVote = '';
        var chartWidthRatio = 3;
        
        var setupPolls = function() {
            for( var i = 0; i < $scope.allPolls.length; i++ ) {
                $scope.allPolls[i].totalVotes = pollService.totalVotes($scope.allPolls[i]);
                $scope.allPolls[i].displaying = false;
                $scope.allPolls[i].userVote = $scope.allPolls[i].options[0];
                $scope.allPolls[i].url = 'https://fcc-voting-app-will-is-coding.c9users.io/#/poll/' + $scope.allPolls[i]._id;
                $scope.allPolls[i].submitted = false;
                
                $scope.allPolls[i].voteMessage = { submitted: false, message: "", error: false }
                
                var hasVoted = $scope.allPolls[i].voters.findIndex( voter => voter.username === $scope.username );
                if ( hasVoted !== -1 ) {
                    $scope.allPolls[i].alreadyVoted = true;
                }
                else {
                    $scope.allPolls[i].alreadyVoted = false;
                }
            }
        };
        
        
        function checkUserStatus(error, username) {
            if(error)
                throw error;
            else if( username !== '' ) {
                $scope.loggedIn = true;
                $scope.username = username;
            }
        }
        userService.getUsername(checkUserStatus);
        
        var getAllPolls = function(error, polls) {
            if( error )
                throw error;
            else {
                $scope.allPolls = polls;
                setupPolls();
            }
        };
        pollService.fetchAllPolls(getAllPolls);
        
        
        $scope.animatePanel = function() {
            console.log(' ');
            /*console.log(panelHeading);
            if( isOpen ) {
                
            }*/
        };
        
        $scope.displayPoll = function(poll, id) {
            var pollData = poll.options;
            poll.displaying = !poll.displaying;
            
            if( $(id + " > svg").length === 0 )
                pollService.buildChart(pollData, id, chartWidthRatio);
                
            
        };
        
        var handleVoteResponse = function(error, response) {
            if ( response && !error ) {
                $scope.allPolls[tempPollIndex].voteMessage = response;
                if( response.submitted ) {
                    //$scope.allPolls[tempPollIndex].options[tempOptIndex].count++;
                    //update Poll's chart
                }
                else {
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
            
            tempOptIndex = poll.options.findIndex( option => option._id === poll.userVote._id );
            pollService.submitVote(poll.userVote.vote, poll._id, poll.userVote._id, handleVoteResponse);
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
        
        $scope.addOption = function(newOpt, poll) {
            pollService.addOption(newOpt, poll);
        };
        
        $scope.selectLink = function($event) {
            $event.target.select();
        };
        
    }]);
})();