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
        
        function getUserStatus(error, username) {
            if( error )
                throw error;
            else if( username !== '' ) {
                that.username = username;
                that.userLoggedIn = true;
            }
        }
        
        userService.getUsername(getUserStatus);
        
        //Check for IP Address too
        var userHasVoted = function(poll) {
            if( poll.voters.findIndex( voter => voter.username === that.username ) !== -1 )
                return true;
            else
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
                var newOption = { vote: option, count: 0 };

                $http({method: 'PUT', url: '/api/poll/' + poll._id + '/' + option, data: JSON.stringify(newOption)})
                    .then( function successCB(response) {
                        if( response.data.submitted ) {
                            console.log(response.data.message);
                            chartFactory.addOption(option, poll, chartID);
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
        
        //TODO: Change the chart & its legend upon update
        this.updateOptions = function(newOptions, removedOptions, poll_id, handlePollEdition) {
            var updateInfo = { _id: poll_id, newOptions: newOptions, removedOptions: removedOptions };
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
            console.log(optionData);
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
                    console.log(response);
                    that.poll = response.data;
                    setupPolls(response.data);
                    handlePoll(null, response.data);
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
                        chartFactory.addVote(userVote, poll);
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
        
        
        this.deletePoll = function(pollID) {
            console.log(pollID);
          $http({method: 'DELETE', url: '/api/poll/' + pollID})
            .then( function successCB(response) {
                console.log(response);
            }, function errorCB(error) {
                if( error )
                    throw error;
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