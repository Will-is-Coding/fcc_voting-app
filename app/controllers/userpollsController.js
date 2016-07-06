'use strict';
(function() {
    angular.module('VotingApp').controller('UserPollsController', [ '$scope', 'userService', 'pollService', function($scope, userService, pollService) {
        $scope.myPolls = [];
        $scope.updateSuccess = false;
        $scope.message = null;
        
        var tempPoll = null;
        
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
       
        
        var setupMyPollsOptions = function() {
           for( var i = 0; i < $scope.myPolls.length; i++ ) {
               $scope.myPolls[i].newOptions = [ new _option() ];
               $scope.myPolls[i].removedOptions = [];
           }
       };
        
        var handlePolls = function(polls) {
                $scope.myPolls = polls;
                setupMyPollsOptions();
        };
        
        pollService.getMyPolls(handlePolls);
        
       
        $scope.drawPoll = function(poll, id) {
            if( $(id + " > svg").length === 0 ) {
                pollService.buildChart(poll, id);
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
        
        //TODO: CLEAN THE OPTIONS TO NOTHING BUT THE VOTE
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