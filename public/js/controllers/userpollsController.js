'use strict';
(function() {
	angular.module('VotingApp').controller('UserPollsController', [ '$scope', 'userService', 'pollService', function($scope, userService, pollService) {
		
		$scope.myPolls	= [];
		$scope.loaded	= false;
		
		var tempPoll		= null;
		var tempPollIndex	= null;
		
		function _option() {
		   this.added = false;
		   this.optText = '';
		   this.isUnique = true;
		}
	   
		$scope.aUniqueOption = function (poll, opt) {
			for( var i = 0; i < poll.options.length; i++ ) {
				if( opt.optText && poll.options[i].vote.toLowerCase() === opt.optText.toLowerCase() ) {
					opt.isUnique = false;
					return false;
				}
			}
			for( var k = 0; k < poll.newOptions.length; k++ ) {
				if( opt.optText && poll.newOptions[k].optText.toLowerCase() === opt.optText.toLowerCase() && poll.newOptions[k].added) {
					opt.isUnique = false;
					return false;
				}
			}
			opt.isUnique = true;
			return true;
	   };
	   
		
		var setupMyPollsOptions = function() {
		   for( var i = 0; i < $scope.myPolls.length; i++ ) {
			   $scope.myPolls[i].newOptions		= [ new _option() ];
			   $scope.myPolls[i].removedOptions = [];
			   $scope.myPolls[i].deletePoll 	= false;
			   $scope.myPolls[i].clearVotes 	= false;
			   $scope.myPolls[i].updateSuccess	= false;
			   $scope.myPolls[i].message		= '';		
		   }
	   };
		
		var handlePolls = function(error, polls) {
			if(error)
				throw error;
				
			$scope.loaded = true;
			
			if( polls ) {
				$scope.myPolls = polls;
				setupMyPollsOptions();
			}
		};
		
		pollService.getMyPolls(handlePolls);
		
	   
		$scope.drawPoll = function(poll, id, index) {
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
	   
	   
		$scope.addOpt = function(poll, option, index) {
			if( option.optText.length > 0 && $scope.aUniqueOption(poll, option)) {
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
		
		var cleanNewOptions = function(newOptions) {
			var cleanOptions = [];
			for( var i = 0; i < newOptions.length; i++ ) {
				cleanOptions.push(newOptions[i].optText);
			}
			return cleanOptions;
		};
		
		var handlePollEdition = function(err, response) {
			console.log(response);
			if( err )
				throw err;
			if( response.success ) {
				$scope.updateSuccess = true;

				for( var i = tempPoll.newOptions.length - 1; i >= 0; i-- ) {
					console.log(tempPoll.newOptions);
					if( tempPoll.newOptions[i].added )
						tempPoll.newOptions.pop();
				}
				
				tempPoll.options = response.options;
			}
			else
				$scope.updateSucces = false;
				
			$scope.message = response.message;
			tempPoll.newOptions.push( new _option() );
		  
		};
		
		var handleClearVotes = function(err, response) {
			console.log(response);
			if( err )
				throw err;
			if( response.success ) {
				$scope.clearVotesSuccess = true; 
				
				for( var i = 0; i < tempPoll.options.length; i++ ) {
					tempPoll.options[i].count = 0;
				}
			}
		};
		
		var handlePollVisiblity = function(err, response) {
			console.log('handling');
		};
		
		$scope.makePollOptionChanges = function(poll, index) {
			tempPollIndex = index;
			if( poll.deletePoll ) {
				pollService.deletePoll(poll._id, handlePollDeletion);
			}
			else {
				tempPoll = poll;
				
				if( (poll.newOptions.length > 0 || poll.removedOptions.length > 0) && optionsChanged(poll) ) {
					poll.newOptions.pop();
					pollService.updateOptions( cleanNewOptions(poll.newOptions), poll.removedOptions, poll.options, poll._id, poll.creator.name, handlePollEdition );
				}
				if( poll.clearVotes ) {
					console.log('here');
					pollService.clearVotes(poll, handleClearVotes);
				}
				if( poll.isPrivate ) {
					pollService.changePollVisiblity(poll._id, handlePollVisiblity);
				}
			}
			
		};
		
		var handlePollDeletion = function(err, response) {
			if( err || response.err )
				throw err;

			console.log(response);
			if( response.success ) {
				$scope.myPolls.splice(tempPollIndex, 1);
			}
		};
		
		var optionsChanged = function(poll) {
			if( poll.removedOptions.length > 0 )
				return true;
				
			for(var i = 0; i < poll.newOptions.length; i++) {
				if( poll.newOptions[i].added )
					return true;
			}
			
			return false;
		};
		
		
	}]);
})();