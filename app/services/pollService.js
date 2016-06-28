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
        
        this.updateOptions = function(newOptions, removedOptions, poll_id) {
            var updateInfo = { _id: poll_id, newOptions: newOptions, removedOptions: removedOptions };
            $http({method: 'POST', url: '/api/poll/' + poll_id, data: JSON.stringify(updateInfo)})
                .then( function successCB(response) {
                    console.log(response);
                }, function errorCB(error) {
                    throw error; 
                });
        };
        
        this.createPoll = function(question, optionData, secret, draft) {
            createVotes(optionData);
            console.log(this.options);
            var newPoll = { question: question, options: this.options, secret: secret, draft: draft };
            $http({method:'POST', url: '/api/createpoll', data: JSON.stringify(newPoll) })
                .then( function successCB(response) {
                    that.poll = response.data;
                    console.log(response);
                },
                function errorCB(error) { throw error; });
        };
        
        this.fetchPoll = function(pollID, callback) {
            $http({ method: 'GET', url: '/api/poll/' + pollID })
                .then( function successCB(response) {
                    console.log(response);
                    that.poll = response.data;
                    callback(null, response.data);
                }, function errorCB(error) {
                    if(error)
                        console.log(error, null);
                });
        };
        
        this.submitVote = function(userVote, pollID) {
            var voteData = JSON.stringify({ _id: pollID, vote: userVote });
            console.log(voteData);
            //Previous version used $routeParams.id
            $http({method: 'PUT', url: '/api/poll/' + pollID, data: voteData})
                .then( function successCB(response) {
                    if( response.data.submitted === true )
                        chartFactory.addVote(userVote);
                    else
                        console.log(response.data.message);
                    //callback(response.data.submitted, response.data.message);
                    
                }, function errorCB(error) { 
                    if(error) 
                        throw error; 
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
})();