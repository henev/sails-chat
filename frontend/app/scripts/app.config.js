'use strict';

angular.module('sailsChatApp')
    .config(function($urlRouterProvider, $stateProvider) {

        $urlRouterProvider.otherwise('/');

        $stateProvider.state('main', {
            url: '/',
            templateUrl: '/views/main.html',
            controller: 'MainCtrl'
        });
    })
    .constant('API_URL', 'http://localhost:1337/');
