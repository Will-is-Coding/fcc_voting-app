'use strict';
/** TODO: FIX VALIDATION ON FORM; ALLOW CREATING ANOTHER POLL WHEN CLICKING 'NEW POLL' **/
/** ERR: CURRENTLY FAILING TO ADD CORRECTLY, NEXT NEW POLL COMBINES WITH LAST ONE **/
/** ERR: IF POLL EXISTS DOES NOT RETURN CORRECTLY NOR RESET OPTIONS CORRECTLY **/
( function() {
    angular.module('VotingApp').controller('PollCreationController', ['$scope', '$http', 'pollService', function($scope, $http, pollService) {
        $scope.poll = '';
        $scope.secret= false;
        $scope.draft = false;
        $scope.created = false;
        $scope.creationError = false;
        $scope.creationMessage = "";
        $scope.tempOptions = [];
        
        function _option() {
            this.added = false;
            this.optText = '';
            this.unique = true;
        }
        
        $scope.options = [new _option(), new _option()];
        
        $scope.checkIfUnique = function(newOption) {
            if( newOption.optText !== undefined || newOption.optText !== '' ) {
                if( $scope.options.findIndex( option => option.optText.toLowerCase() === newOption.optText.toLowerCase() && option.added && option.optText.length === newOption.optText.length ) !== -1 )
                    newOption.unique = false;
                else
                    newOption.unique = true;
            }
            else
                newOption.unique = true;
        };
       
        $scope.addOpt = function(option, index) {
            if( option.optText.length > 0 && option.unique ) {
                option.added = true;
                if( index !== 0 )
                    $scope.options.push(new _option());
            }
        };
        
        $scope.removeOpt = function(option, index) {
            console.log('here');
            if(index !== -1 ) {
                $scope.options.splice(index, 1);
                if( $scope.options.length < 2 )
                    $scope.options.push(new _option());
            }
        };
        
        var checkOptionsValid = function() {
            var amountAdded = 0;
            for( var i = 0; i < $scope.options.length; i++ ) {
                if( $scope.options[i].added )
                    amountAdded++;
            }
            if( amountAdded > 1 )
                return true;
            else
                return false;
        };
        
        var cleanOptions = function() {
            $scope.tempOptions = $scope.options;
            for( var i = 0; i < $scope.options.length; i++ ) {
                if( $scope.options[i].optText !== '' && $scope.options[i].optText.length > 0 && $scope.options[i].added )
                    $scope.options[i] = $scope.options[i].optText;
                else
                    $scope.options.splice(i, 1);
            }
        };
        
        var handlePollCreation = function(err, response) {
            if( err ) {
                $scope.created = false;
                $scope.message = "Error!";
                console.log(err);
                $scope.creationError = true;
            }
            else if( response.success ) {
                $scope.created = true;
                $scope.message = response.message;
                $scope.options = [new _option(), new _option()];
                $scope.poll = "";
                $scope.newPollUrl = "https://fcc-voting-app-will-is-coding.c9users.io/#/poll/" + response.poll._id;
            }
            else {
                $scope.created = false;
                $scope.creationError = true;
                $scope.message = response.message;
                $scope.pollError = response.poll;
                $scope.optionsError = response.options;
            }
        };

        $scope.createPoll = function() {
            
            if( $scope.poll.length > 0 && $scope.options.length > 1 && checkOptionsValid() ) {
                cleanOptions();
                console.log($scope.options);
                console.log($scope.poll);
                pollService.createPoll($scope.poll, $scope.options, $scope.secret, $scope.draft, handlePollCreation);
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