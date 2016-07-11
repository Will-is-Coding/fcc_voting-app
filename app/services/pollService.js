'use strict';
//var Poll = require('../models/poll.js');
(function() {
    angular.module('VotingApp').service('pollService', [ '$http', '$routeParams', 'chartFactory', 'userService', function($http, $routeParams, chartFactory, userService) {
        
        this.userLoggedIn = false;
        this.username = '';
        
        var that = this;
        
        function option(text) {
            this.optText = text;
        }
        
        this.getUserStatus = function(error, username) {
            if( error )
                throw error;
            else if( username !== '' ) {
                that.username = username;
                that.userLoggedIn = true;
            }
            console.log(that.userLoggedIn);
        };
        
        userService.getUsername(this.getUserStatus);
        
        //Check for IP Address too; Check if user is creator of poll
        var userHasVoted = function(poll) {

            var voterIndexIfUserAdded = poll.voters.findIndex( voter => voter.username === that.username );
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
                
                $http({method: 'PUT', url: '/api/poll/' + poll._id + '/' + option, data: JSON.stringify(newOption)})
                    .then( function successCB(response) {
                        
                        if( response.data.submitted ) {
                            //chartFactory.addOption(option, poll, chartID, response.data.options);
                            chartFactory.editOptions(poll, response.data.options, true);
                            chartFactory.addOrRemoveVote(poll, response.data.options, false);
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
        
        var removeUserIfVotedForOption = function(poll) {
            var optRemovedIndex = poll.options.findIndex( option => option._id === poll.userAddedOptionID );
            if( optRemovedIndex !== - 1) {
                poll.alreadyVoted = false;
            }
        };
        
        this.removeOption = function(poll, handleRemoveOptionResponse) {

            if( this.userLoggedIn && poll.userAddedOptionID ) {

                $http({method: 'DELETE', url: '/api/poll/' + poll._id + '/' + poll.userAddedOptionID})
                    .then( function successCB(response) {
                        if( response.data.submitted ) {
                            //chartFactory.removeOption(response.data.options, poll);
                            chartFactory.editOptions(poll, response.data.options, false);
                            chartFactory.addOrRemoveVote(poll, response.data.options, false);
                            //removeUserIfVotedForOption(poll);
                        }
                            
                        handleRemoveOptionResponse(null, response.data);
                        
                    }, function errorCB(error) {
                        handleRemoveOptionResponse(error, null);
                    });
            }  
        };
        
        
        //TODO: Change the chart & its legend upon update
        this.updateOptions = function(newOptions, removedOptions, allOptions, poll_id, poll_creator, handlePollEdition) {
            var updateInfo = { _id: poll_id, newOptions: newOptions, removedOptions: removedOptions, options: allOptions, creator: poll_creator };
            $http({method: 'POST', url: '/api/poll/' + poll_id, data: JSON.stringify(updateInfo)})
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

            $http({method:'POST', url: '/api/createpoll', data: JSON.stringify(newPoll) })
                .then( function successCB(response) {
                    console.log(response);
                    handlePollCreation(null, response.data);
                },
                function errorCB(error) { handlePollCreation(error, null); throw error; });
        };
        
        this.fetchPoll = function(pollID, handlePoll) {
            $http({ method: 'GET', url: '/api/poll/' + pollID })
                .then( function successCB(response) {
                    setupPolls([response.data]);
                    handlePoll(null, response.data, that.username, that.userLoggedIn);
                }, function errorCB(error) {
                    if(error)
                        console.log(error);
                    handlePoll(error, null);
                });
        };
        
        this.fetchAllPolls = function( handlePolls ) {
            $http({ method: 'GET', url: '/api/fetchpolls'})
                .then( function successCB(response) {
                    setupPolls(response.data);
                    handlePolls(null, response.data, that.username, that.userLoggedIn);
                }, function errorCB(error) {
                    handlePolls(error, null);
                } );
        };
        
        this.getMyPolls = function( handlePolls ) {
            if( this.userLoggedIn ) {
                $http({ method: 'GET', url: '/api/user/polls'})
                    .then( function successCB(response) {
                        console.log(response);
                        setupPolls(response.data);
                        handlePolls(response.data);
                        
                    }, function errorCB(error) {
                        if (error)
                            throw error;
                    });
            }
        };
        
        this.submitVote = function(userVote, poll, optionID, handleResponse) {
            var voteData = JSON.stringify({ _id: poll._id, option_id: optionID, vote: userVote});
            console.log(voteData);
            
            $http({method: 'PUT', url: '/api/poll/' + poll._id, data: voteData})
                .then( function successCB(response) {
                    if( response.data.submitted === true ) {
                        chartFactory.addOrRemoveVote(poll, response.data.options, true);
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
                $http({method: 'DELETE', url: '/api/poll/' + poll._id + '/remove_vote/' + poll.userVotedFor})
                    .then( function successCB(response) {
                        if( response.data.submitted ) {
                            //poll.options = response.data.options;
                            chartFactory.addOrRemoveVote(poll, response.data.options, false);
                        }
                        handleRemoveVote(null, response.data);
                    }, function errorCB(error) {
                       handleRemoveVote(error, null); 
                    });
          }
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
        
        
        this.deletePoll = function(pollID, handlePollDeletion) {
            console.log(pollID);
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