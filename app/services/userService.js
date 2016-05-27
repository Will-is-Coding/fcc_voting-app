angular.module("VotingApp").factory('userService', ['$http', function($http) {
    var user = { username: '' };
    user.setName = function(username) {
        this.username = username;
    };
    
    user.getName = function() {
        return this.username;
    };
    
    return user;
}]);