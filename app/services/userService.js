angular.module("VotingApp").factory('userService', ['$http', function($http) {
    var user = { username: '' };
    
    user.requestName = function() {
        $http({method: 'GET', url: '/api/authenticate'}).then( function success(data) {
            
        });
    };
    
    user.setName = function(username) {
        this.username = username;
    };
    
    user.getName = function() {
        return this.username;
    };
    
    return user;
}]);