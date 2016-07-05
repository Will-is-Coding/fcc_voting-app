'use strict';
(function() {
    angular.module('VotingApp').controller('UserPollsController', [ '$scope', 'userService', 'pollService', function($scope, userService, pollService) {
        $scope.myPolls = [];
        $scope.updateSuccess = false;
        $scope.message = null;
        var tempPoll = null;
        var pollLegendControl = {};
        
        var setUsername = function(error, username) {
           if( error )
                throw error;
            else {
                $scope.loggedIn = true;
                $scope.username = username;
            }
        };
        
        userService.getUsername(setUsername);
        
        function _option() {
           this.added = false;
           this.optText = '';
        }
       
        var aUniqueOption = function (poll, opt) {
            for( var i = 0; i < poll.options.length; i++ ) {
                if( poll.options[i].vote.toLowerCase() === opt.toLowerCase() )
                    return false;
            }
            for( var k = 0; k < poll.newOptions.length; k++ ) {
                if( poll.newOptions[k].optText.toLowerCase() === opt.toLowerCase() && poll.newOptions[k].added)
                    return false;
            }
            return true;
       };
       
        
        var setupMyPolls = function() {
           for( var i = 0; i < $scope.myPolls.length; i++ ) {
               $scope.myPolls[i].totalVotes = pollService.totalVotes($scope.myPolls[i]);
               $scope.myPolls[i].newOptions = [ new _option() ];
               $scope.myPolls[i].removedOptions = [];
               $scope.myPolls[i].url = 'https://fcc-voting-app-will-is-coding.c9users.io/#/poll/' + $scope.myPolls[i]._id;
           }
       };
        
        var getMyPolls = function() {
            userService.getMyPolls( function(polls) {
                $scope.myPolls = polls;
                setupMyPolls();
            });
        };
        
        getMyPolls();
        
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
       
        $scope.drawPoll = function(poll, id) {
            if( $(id + " > svg").length === 0 ) {
                pollLegendControl.poll = poll;
                pollService.buildChart(poll.options, id, 3, pollLegendControl.legendEnabling);
            }
        };
       
       
        $scope.addOpt = function(poll, option, index) {
            if( option.optText.length > 0 && aUniqueOption(poll, option.optText)) {
                option.added = true;
                poll.newOptions.push(new _option());
            }
        };
        
        $scope.removeOpt = function(option, poll, index, curOpt) {
            if( poll.newOptions.length > 1 || poll.options.length > 1 || (poll.newOptions.length + poll.options.length > 2) ) {
                if( curOpt ) { 
                    poll.options.splice(index, 1);
                    poll.removedOptions.push(option._id);
                }
                else {
                    poll.newOptions.splice(index, 1);
                }
            }
        };
        
        var handlePollEdition = function(err, response) {
            console.log(response);
            if( err )
                throw err;
            if( response.success ) {
                $scope.updateSuccess = true;
                for( var i = 0; i < tempPoll.newOptions.length; i++) {
                    tempPoll.newOptions[i].submittedSuccess = true;
                }
            }
            else
                $scope.updateSucces = false;
                
            $scope.message = response.message;
            tempPoll.newOptions.push( new _option() );
          
        };
        
        $scope.makePollOptionChanges = function(poll) {
            poll.newOptions.pop();
            tempPoll = poll;
            pollService.updateOptions( poll.newOptions, poll.removedOptions, poll._id, handlePollEdition );
        };
        
        $scope.deletePoll = function(poll) {
            pollService.deletePoll(poll._id);  
        };
        
    }]);
})();