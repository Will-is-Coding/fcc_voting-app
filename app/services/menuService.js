'use strict';

// REFACTOR?
angular.module('VotingApp').factory('menuService', ['userService', '$rootScope', '$http', function(userService, $rootScope, $http) {
    var menu = {
        loggedIn: false,
        tabs: [],
    };
    
    var tab = function(name, url) {
        this.name = name;
        this.url = url;
    };
    
    var homeTab = new tab('Home', '#/');
    var loginTab = new tab('Login', '#/login');
    var signupTab = new tab('Signup', '#/signup');
    var signoutTab = new tab('Signout', 'api/signout');
    
    menu.setTabs = function() {
        console.log('setting...');
        if (userService.getName() !== '') { //If user logged in
            var userTab = new tab(userService.getName(), '#/user/' + userService.getName());
            this.tabs = [ homeTab, userTab, signoutTab ];
        }
        else {
            this.tabs = [ homeTab, loginTab, signupTab ];
        }
    };
    
    menu.getTabs = function() {
        return this.tabs;
    };
    
    menu.subscribe = function(scope, callback) {
        var that = this;
        var handler = $rootScope.$on('updating-tabs-event', function () {
            that.setTabs();
            callback();
        });
        scope.$on('$destroy', handler);
    };
    
    menu.notify = function() {
        $rootScope.$emit('updating-tabs-event');
        console.log('notifying');
    };
    
    userService.requestName( function() { menu.notify(); });
    
    return menu;
}]);