angular.module("VotingApp").factory('userService', function() {
    var user = {};
    var _username = '';
    user.username = '';
    user.setName = function(username) {
        _username = username;
        this.username = username;
    };
    
    user.getName = function() {
        return this.username;
    };
    
    return user;
});