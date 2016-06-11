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
                 if(optionData[i].added === true && optionData[i].optText.length > 0) {
                     var newOpt = new option(optionData[i].optText);
                     that.options.push(newOpt);
                 }
            }
        }
        
        this.addOption = function(option) {
            var newOption = { vote: option, count: 0 };
            console.log('/api/poll/' + $routeParams.id);
            $http({method: 'POST', url: '/api/poll/' + $routeParams.id, data: JSON.stringify(newOption)})
                .then( function successCB(response) {
                    
                }, function errorCB(error) {
                    
                });
        };
        
        this.createPoll = function(question, optionData) {
            createVotes(optionData);
            var newPoll = { question: question, options: this.options };
            $http({method:'POST', url: '/api/createpoll', data: JSON.stringify(newPoll) })
                .then( function successCB(response) {
                    that.poll = response.data;
                    console.log(response);
                },
                function errorCB(error) { throw error; });
        };
        
        this.fetchPoll = function(callback, id) {
            $http({ method: 'GET', url: '/api/poll/' + $routeParams.id })
                .then( function successCB(response) {
                    console.log(response);
                    that.poll = response.data;
                    callback(response.data);
                    chartFactory.createChart(response.data.options, id);
                }, function errorCB(error) {
                    if(error)
                        throw error;
                });
        };
        
        this.submitVote = function(userVote, callback) {
            var voteData = JSON.stringify({ _id: this.poll._id, vote: userVote });
            console.log(voteData);
            $http({method: 'PUT', url: '/api/poll/' + $routeParams.id, data: voteData})
                .then( function successCB(response) {
                    if( response.data.submitted === true )
                        chartFactory.addVote(userVote);
                    
                    callback(response.data.submitted, response.data.message);
                    
                }, function errorCB(error) { 
                    if(error) 
                        throw error; 
                });
        };
        
        this.buildChart = function(options, id) {
           chartFactory.createChart(options, id);  
        };
        
        this.totalVotes = function(poll) {
            var count = 0;
            for( var i = 0; i < poll.options.length; i++ ) {
                count += poll.options[i].count;
            }
            return count;
        };
        
    }]);
})();