'use strict';
//var Poll = require('../models/poll.js');
(function() {
    angular.module('VotingApp').service('pollService', [ '$http', '$routeParams', 'chartFactory', function($http, $routeParams, chartFactory) {
        this.options = [];
        this.poll = {};
        var that = this;
        
        function option(text) {
            this.vote = text;
            this.count = 0;
        }
        
        
        //TODO: Use Regex or something to only add votes without only spaces and longer than one character
        function createVotes(optionData) {
            for( var i = 0; i < optionData.length; i++ ) {
                 if(optionData[i].length > 0) {
                     var newOpt = new option(optionData[i]);
                     that.options.push(newOpt);
                }
            }
        }
        
        this.isUniqueOption = function(newOption, poll) {
            for( var i = 0; i < poll.options.length; i++ ) {
                if( poll.options[i].vote.toLowerCase() === newOption.toLowerCase() )
                    return false;
            }
            return true;
        };
        
        this.addOption = function(option, poll) {
            if( this.isUniqueOption(option, poll) ) {
                var newOption = { vote: option, count: 0 };
                console.log('/api/poll/' + poll._id + '/' + option);
                $http({method: 'PUT', url: '/api/poll/' + poll._id + '/' + option, data: JSON.stringify(newOption)})
                    .then( function successCB(response) {
                        console.log(response.data.message);
                    }, function errorCB(error) {
                        
                    });
            }
        };
        
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
            createVotes(optionData);
            console.log(this.options);
            var newPoll = { question: question, options: this.options, secret: secret, draft: draft };
            $http({method:'POST', url: '/api/createpoll', data: JSON.stringify(newPoll) })
                .then( function successCB(response) {
                    that.poll = response.data;
                    console.log(response);
                    handlePollCreation(null, response.data);
                },
                function errorCB(error) { handlePollCreation(error, null); throw error; });
        };
        
        this.fetchPoll = function(pollID, callback) {
            $http({ method: 'GET', url: '/api/poll/' + pollID })
                .then( function successCB(response) {
                    console.log(response);
                    that.poll = response.data;
                    callback(null, response.data);
                }, function errorCB(error) {
                    if(error)
                        console.log(error);
                    callback(error, null);
                });
        };
        
        this.fetchAllPolls = function( handlePolls ) {
            $http({ method: 'GET', url: '/api/fetchpolls'})
                .then( function successCB(response) {
                    handlePolls(null, response.data);
                }, function errorCB(error) {
                    handlePolls(error, null);
                } );
        };
        
        this.submitVote = function(userVote, pollID, optionID, handleResponse) {
            var voteData = JSON.stringify({ _id: pollID, option_id: optionID, vote: userVote});
            console.log(voteData);
            $http({method: 'PUT', url: '/api/poll/' + pollID, data: voteData})
                .then( function successCB(response) {
                    if( response.data.submitted === true )
                        chartFactory.addVote(userVote);
                        
                    handleResponse(null, response.data);
                        
                    console.log(response.data);
                    
                }, function errorCB(error) { 
                    if(error) {
                        handleResponse(error, null);
                        throw error; 
                    }
                });
        };
        
        this.buildChart = function(options, id, widthRatio) {
           chartFactory.createChart(options, id, widthRatio);  
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