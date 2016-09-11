'use strict';
(function() {
	angular.module('VotingApp').service('pollService', [ '$http', '$routeParams', 'chartFactory', 'userService', function($http, $routeParams, chartFactory, userService) {
		
		this.userLoggedIn = false;
		this.username = '';
		
		var that = this;
		
		function option(text) {
			this.optText = text;
		}
		
		this.getUserStatus = function(error, username, ipaddress) {
			if( error )
				throw error;
			else if( username !== '' ) {
				that.username = username;
				that.userLoggedIn = true;
				that.ipaddress = ipaddress;
			}
		};
		
		userService.getUsername(this.getUserStatus);
		
		//Check for IP Address too; Check if user is creator of poll
		var userHasVoted = function(poll) {
			var voterIndexIfUserAdded   = poll.voters.findIndex( voter => voter.username === that.username || voter.ipaddress === that.ipaddress );

			if( voterIndexIfUserAdded !== -1 ) {
				poll.userVotedFor = poll.voters[voterIndexIfUserAdded].votedFor_id;
				return true;
			}
			else {
				poll.userVotedFor = null;
				return false;
			}
		};
		
		var userAlreadyAddedOption = function(poll) {
			if( that.userLoggedIn ) {
				var optionIndexIfAdded = poll.options.findIndex( option => option.addedBy && option.addedBy === that.username );
				if( optionIndexIfAdded !== -1 ) {
					poll.userAddedOptionID = poll.options[optionIndexIfAdded]._id;
					return true;
				}
			}
			return false;
		};
		
		var setupPolls = function(polls) {
			userService.getUsername(that.getUserStatus);
			for( var i = 0; i < polls.length; i++ ) {
				polls[i].totalVotes = that.totalVotes(polls[i]);
				polls[i].chart = {};
				polls[i].voteMessage = { submitted: false, message: "", error: false };   
				polls[i].url = 'https://fcc-voting-app-will-is-coding.c9users.io/#/poll/' + polls[i]._id;
				polls[i].userVote = polls[i].options[0];
				polls[i].submitted = false;
				polls[i].displaying = false;
				polls[i].addError = false;
				polls[i].alreadyVoted = userHasVoted(polls[i]);
				polls[i].alreadyAdded = userAlreadyAddedOption(polls[i]);
			}
		};
		
		//Use .findIndex?
		this.isUniqueOption = function(newOption, poll) {
			for( var i = 0; i < poll.options.length; i++ ) {
				if( poll.options[i].vote.toLowerCase() === newOption.toLowerCase() )
					return false;
			}
			return true;
		};
		
		this.addOption = function(option, poll, chartID, handleAddOptionResponse) {
			if( this.isUniqueOption(option, poll) ) {
				var newOption = { vote: option, options: poll.options, creator: poll.creator.name };
				
				$http({method: 'PUT', url: '/api/poll/' + poll._id + '/option/' + option, data: JSON.stringify(newOption)})
					.then( function successCB(response) {
						
						if( response.data.success ) {
							chartFactory.editOptions(poll, response.data.options, true);
							chartFactory.editPoll(poll, response.data.options, false);
						}
						
						handleAddOptionResponse(null, response.data);
						
					}, function errorCB(error) {
						handleAddOptionResponse(error, null);
					});
			}
			else {
				handleAddOptionResponse(null, {message: "Option already available", submitted: false});
			}
		};
		
		
		this.removeOption = function(poll, handleRemoveOptionResponse) {

			if( this.userLoggedIn && poll.userAddedOptionID ) {

				$http({method: 'DELETE', url: '/api/poll/' + poll._id + '/option/' + poll.userAddedOptionID})
					.then( function successCB(response) {
						if( response.data.success ) {
							chartFactory.editOptions(poll, response.data.options, false);
							chartFactory.editPoll(poll, response.data.options, false);
						}
							
						handleRemoveOptionResponse(null, response.data);
						
					}, function errorCB(error) {
						handleRemoveOptionResponse(error, null);
					});
			}  
		};
		
		
		this.updateOptions = function(newOptions, removedOptions, allOptions, poll_id, poll_creator, handlePollEdition) {
			var updateInfo = { _id: poll_id, newOptions: newOptions, removedOptions: removedOptions, options: allOptions, creator: poll_creator };
			
			$http({method: 'PUT', url: '/api/poll/' + poll_id, data: JSON.stringify(updateInfo)})
				.then( function successCB(response) {
					console.log(response);
					handlePollEdition(null, response.data);
					
				}, function errorCB(error) {
					handlePollEdition(error, null);
					throw error; 
				});
		};
		
		this.createPoll = function(question, optionData, secret, draft, handlePollCreation) {

			var newPoll = { question: question, options: optionData, secret: secret, draft: draft };

			$http({method:'PUT', url: '/api/poll/new', data: JSON.stringify(newPoll) })
				.then( function successCB(response) {
					console.log(response);
					handlePollCreation(null, response.data);
				},
				function errorCB(error) { handlePollCreation(error, null); throw error; });
		};
		
		this.fetchPoll = function(pollID, handlePoll) {
			console.log('here');
			$http({ method: 'GET', url: '/api/poll/' + pollID })
				.then( function successCB(response) {
					that.ipaddress = response.data.ipaddress;
					setupPolls([response.data.poll]);
					handlePoll(null, response.data.poll, that.username, that.userLoggedIn);
				}, function errorCB(error) {
					if(error)
						console.log(error);
					handlePoll(error, null);
				});
		};
		
		this.fetchAllPolls = function( handlePolls ) {
			
			$http({ method: 'GET', url: '/api/poll/fetchAll'})
				.then( function successCB(response) {
					that.ipaddress = response.data.ipaddress;
					setupPolls(response.data.polls);
					handlePolls(null, response.data.polls, that.username, that.userLoggedIn);
				}, function errorCB(error) {
					handlePolls(error, null);
				} );
		};
		
		this.getMyPolls = function( handlePolls ) {
			userService.getUsername(this.getUserStatus);
			if( this.userLoggedIn ) {
				$http({ method: 'GET', url: '/api/poll/user'})
					.then( function successCB(response) {
						console.log(response);
						setupPolls(response.data);
						handlePolls(null, response.data);
						
					}, function errorCB(error) {
						if (error) {
							handlePolls(error, null);
							throw error;
						}
					});
			}
		};
		
		this.submitVote = function(userVote, poll, optionID, handleResponse) {
			var voteData = JSON.stringify({ _id: poll._id, option_id: optionID, vote: userVote});
			console.log(voteData);
			
			$http({method: 'PUT', url: '/api/poll/' + poll._id + '/vote/' + optionID, data: voteData})
				.then( function successCB(response) {
					if( response.data.success === true ) {
						chartFactory.editPoll(poll, response.data.options, true);
					}
						
					handleResponse(null, response.data);
						
					console.log(response.data);
					
				}, function errorCB(error) { 
					if(error) {
						handleResponse(error, null);
						throw error; 
					}
				});
		};
		
		this.removeVote = function(poll, handleRemoveVote) {
			if( poll.alreadyVoted && poll.userVotedFor )  {
				console.log(poll);
				$http({method: 'DELETE', url: '/api/poll/' + poll._id + '/vote/' + poll.userVotedFor})
					.then( function successCB(response) {
						if( response.data.success ) {
							chartFactory.editPoll(poll, response.data.options, false);
						}
						handleRemoveVote(null, response.data);
					}, function errorCB(error) {
					   handleRemoveVote(error, null); 
					});
		  }
		};
		
		this.clearVotes = function(poll, handleClearVotes) {
			$http({ method: 'DELETE', url: '/api/poll/' + poll._id + '/votes'})
				.then( function successCB(response) {
					if( response.data.success ) {
						chartFactory.editPoll(poll, {vote: "No Votes", count: 0}, false);
					}
					handleClearVotes(null, response.data);
				}, function errorCB(error) {
				   handleClearVotes(error, null); 
				});
		};
		
		this.buildChart = function(poll, id) {
		   chartFactory.createChart(poll, id);  
		};
		
		this.totalVotes = function(poll) {
			var count = 0;
			for( var i = 0; i < poll.options.length; i++ ) {
				count += poll.options[i].count;
			}
			return count;
		};
		
		
		this.changePollVisiblity = function(pollID, isPrivate, handlePollVisibility) {
			$http({method: 'PUT', url: '/api/poll/' + pollID + '/visibility'})
				.then( function successCB(response) {
					handlePollVisibility(null, response.data);	
				}, function errorCB(error) {
					if( error ) {
						handlePollVisibility(error, null);
						throw error;
					}
				});
		};
		
		this.deletePoll = function(pollID, handlePollDeletion) {
			$http({method: 'DELETE', url: '/api/poll/' + pollID})
				.then( function successCB(response) {
					console.log(response);
					handlePollDeletion(null, response.data);
				}, function errorCB(error) {
					if( error ) {
						handlePollDeletion(error, null);
						throw error;
					}
				});
		};
		
	}]);
	
	/** Written by Tamlyn on StackExchange **/
	/** Allows one click to select the entire input text, but also allows repositioning of cursor to select section of it if desired **/
	angular.module('VotingApp').directive('selectOnClick', function() {
		return {
			restrict: 'A',
			link: function(scope, element) {
				var focusedElement = null;
				element.on('click', function() {
					if( focusedElement != this ) {
						this.select();
						focusedElement = this;
					}
				});
				element.on('blur', function() {
					focusedElement = null;
				});
			}
		};
	});
})();