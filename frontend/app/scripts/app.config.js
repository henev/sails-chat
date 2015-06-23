'use strict';

angular.module('sailsChatApp')
    .config(function($urlRouterProvider, $stateProvider, $authProvider, $httpProvider, toastrConfig, API_URL) {

        toastrConfig.positionClass = 'toast-bottom-right';

        $urlRouterProvider.otherwise('/');

        $stateProvider
            .state('main', {
                url: '/',
                templateUrl: '/views/main.html',
                controller: 'MainCtrl'
            })
            .state('rooms', {
                url: '/rooms',
                templateUrl: '/views/rooms.html',
                controller: 'RoomsCtrl'
            })
            .state('room', {
                url: '/room?name',
                templateUrl: '/views/room.html',
                controller: 'RoomCtrl'
            })
            .state('logout', {
                controller: 'LogoutCtrl'
            });

        $authProvider.loginUrl = API_URL + '/user/login';
        $authProvider.signupUrl = API_URL + '/user/register';
    })

    .constant('API_URL', environment)

    .run(function($rootScope, $auth, $http, $state) {
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
            //$http.defaults.headers.common['Authorization'] = 'Bearer ' + $auth.getToken();

            if (toState.name === 'main' && $auth.isAuthenticated()) {
                event.preventDefault();
                $state.go('rooms');
            }

            if (toState.name !== 'main' && !$auth.isAuthenticated()) {
                event.preventDefault();
                $state.go('main');
            }
        });
    });
