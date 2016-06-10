'use strict';
//var Poll = require('../models/poll.js');
(function() {
    angular.module('VotingApp').service('pollService', [ '$http', function($http) {
        this.options = [];
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
            
        }
        
        this.createPoll = function(question, optionData, creator) {
            createVotes(optionData);
            var newPoll = { question: question, options: this.options, creator: 'test', creationDate: 0 };
            console.log(newPoll);
            $http({method:'POST', url: 'api/newpoll', data: JSON.stringify(newPoll) })
                .then( function successCB(response) {
                    console.log(response);
                },
                function errorCB(error) { throw error; });
        };
        
    }]);
})();