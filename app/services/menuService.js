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
            var userTab = new tab(userService.username, '#/user/' + userService.username);
            this.tabs = [ homeTab, userTab, signoutTab ];
            console.log('with user...');
        }
        else {
            this.tabs = [ homeTab, loginTab, signupTab ];
            console.log('with usual...');
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
    
    //Move?
    $http({ method: 'GET', url: '/api/authenticate'}).then( function success(response) {
        if (response.data.username) {
            userService.setName(response.data.username);
            menu.notify();
        }
    }, function error(response) {
        console.log('error');
    });
    
    return menu;
}]);