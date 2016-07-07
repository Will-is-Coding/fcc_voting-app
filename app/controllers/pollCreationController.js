'use strict';
( function() {
    angular.module('VotingApp').controller('PollCreationController', ['$scope', '$http', 'pollService', function($scope, $http, pollService) {
        $scope.poll = '';
        $scope.secret= false;
        $scope.draft = false;
        $scope.created = false;
        $scope.creationError = false;
        $scope.creationMessage = "";
        $scope.newOptionsValid = false;
        $scope.tempOptions = [];
        
        function _option() {
            this.added = false;
            this.optText = '';
            this.unique = true;
        }
        
        $scope.options = [new _option(), new _option()];
        
        $scope.pollRemoveError = function() {
            if( !$scope.poll || $scope.poll.length <= 0 ) {
                $scope.creationError = false;
                $scope.pollError = false;
            }
        };
        
        $scope.checkIfUnique = function(newOption) {
            if( newOption.optText !== undefined || newOption.optText !== '' ) {
                if( $scope.options.findIndex( option => option.optText.toLowerCase() === newOption.optText.toLowerCase() && option.added && option.optText.length === newOption.optText.length ) !== -1 ) {
                    newOption.unique = false;
                    $scope.newOptionsValid = false;
                }
                else {
                    newOption.unique = true;
                    $scope.newOptionsValid = true;
                }
            }
            else {
                newOption.unique = true;
                $scope.newOptionsValid = true;
            }
        };
       
        $scope.addOpt = function(option, index) {
            if( option.optText.length > 0 && option.unique ) {
                option.added = true;
                $scope.newOptionsValid = true;
                if( index !== 0 )
                    $scope.options.push(new _option());
            }
            else
                $scope.newOptionsValid = false;
        };
        
        $scope.removeOpt = function(option, index) {
            if(index !== -1 ) {
                $scope.options.splice(index, 1);
                if( $scope.options.length < 2 )
                    $scope.options.push(new _option());
            }
        };
        
        $scope.checkOptionsValid = function() {
            var amountAdded = 0;
            for( var i = 0; i < $scope.options.length; i++ ) {
                if( $scope.options[i].added )
                    amountAdded++;
            }
            if( amountAdded > 1 ) {
                $scope.newOptionsValid = true;
                return true;
            }
            else {
                $scope.newOptionsValid = false;
                return false;
            }
        };
        
        var cleanOptions = function() {
            $scope.tempOptions = [];
            for( var i = 0; i < $scope.options.length; i++ ) {
                if( $scope.options[i].optText !== '' && $scope.options[i].optText.length > 0 && $scope.options[i].added ) {
                    console.log($scope.options);
                    $scope.tempOptions[i] = $scope.options[i].optText;
                }
                else
                    $scope.tempOptions.splice(i, 1);
            }

        };
        
        var handlePollCreation = function(err, response) {
            console.log(response);
            if( err || response.err ) {
                $scope.created = false;
                $scope.message = "Error!";
                console.log(err);
                $scope.creationError = true;
            }
            else if( response.success ) {
                $scope.created = true;
                $scope.creationError = false;
                $scope.pollError = false;
                $scope.optionsError = false;
                $scope.message = response.message;
                $scope.options = [new _option(), new _option()];
                $scope.poll = "";
                $scope.newPollUrl = "https://fcc-voting-app-will-is-coding.c9users.io/#/poll/" + response.poll_id;
            }
            else {
                $scope.created = false;
                $scope.creationError = true;
                $scope.message = response.message;
                $scope.pollError = !response.pollSuccess;
                $scope.optionsError = !response.optionsSuccess;
            }
        };

        $scope.createPoll = function() {
            
            if( $scope.poll.length > 0 && $scope.options.length > 1 && $scope.checkOptionsValid() ) {
                cleanOptions();
                pollService.createPoll($scope.poll, $scope.tempOptions, $scope.secret, $scope.draft, handlePollCreation);
            }
            else {
                $scope.created = false;
                $scope.message = "Your poll question is either not valid or you don't have two or more options added";
            }
        };
        
        $scope.restartNewPoll = function() {
            $scope.created = false;
        };
       
    }]);
})();