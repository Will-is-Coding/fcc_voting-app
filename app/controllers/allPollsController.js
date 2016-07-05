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
        var addedVote = "";

        var chartWidthRatio = 3;
        
        var pollLegendControl = {};
        
        //Get ipaddress and check?
        var setupPolls = function() {
            for( var i = 0; i < $scope.allPolls.length; i++ ) {
                $scope.allPolls[i].totalVotes = pollService.totalVotes($scope.allPolls[i]);
                $scope.allPolls[i].displaying = false;
                $scope.allPolls[i].userVote = $scope.allPolls[i].options[0];
                $scope.allPolls[i].url = 'https://fcc-voting-app-will-is-coding.c9users.io/#/poll/' + $scope.allPolls[i]._id;
                $scope.allPolls[i].submitted = false;
                $scope.allPolls[i].addError = false;
                
                $scope.allPolls[i].voteMessage = { submitted: false, message: "", error: false };
                
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
        
        pollLegendControl.legendEnabling = function(legend, pie, path, arc) {
            var data = pollLegendControl.poll.options;
            legend.on('click', function(vote) {
                  var rect = d3.select(this);
                  var enabled = true;
                  var totalEnabled = d3.sum(data.map(function(d) {
                    return (d.enabled && d.count > 0) ? 1 : 0;
                  }));
                  
                  if (rect.attr('class') === 'disabled') {
                    rect.attr('class', '');
                  } else {
                    if (totalEnabled < 2) return;
                    rect.attr('class', 'disabled');
                    enabled = false;
                  }
                  
                  pie.value(function(d) { 
                    if (d.vote === vote) d.enabled = enabled;
                    return (d.enabled) ? d.count : 0;
                  });
                  
                  path = path.data(pie(data));
                  
                  path.transition()
                    .duration(750)
                    .attrTween('d', function(d) {
                      var interpolate = d3.interpolate(this._current, d);
                      this._current = interpolate(0);
                      return function(t) {
                        return arc(interpolate(t));
                      };
                    });
                });
        };
        
        $scope.displayPoll = function(poll, id, index) {
            var pollData = poll.options;
            poll.displaying = !poll.displaying;
            
            if( $(id + " > svg").length === 0 ) {
                pollLegendControl.poll = poll;
                pollService.buildChart(pollData, id, chartWidthRatio, pollLegendControl.legendEnabling);
            }
        };
        
        var handleVoteResponse = function(error, response) {
            if ( response && !error ) {
                $scope.allPolls[tempPollIndex].voteMessage = response;
                if( response.submitted ) {

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
            
            pollService.submitVote(poll.userVote.vote, poll, poll.userVote._id, "#chart-" + index, handleVoteResponse);
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
            pollService.addOption(newOpt, poll, handleAddOptionResponse);
        };
        
    }]);
})();