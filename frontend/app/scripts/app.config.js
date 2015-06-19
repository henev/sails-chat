'use strict';

angular.module('sailsChatApp')
    .config(function($urlRouterProvider, $stateProvider, $authProvider, toastrConfig, API_URL) {

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
            });

        $authProvider.loginUrl = API_URL + 'user/login';
        $authProvider.signupUrl = API_URL + 'user/register';
    })

    .constant('API_URL', 'http://10.10.1.103:1337/')

    .run(function($rootScope, $auth, $state, socketEvents, API_URL) {
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){

            if (toState.name === 'main' && $auth.isAuthenticated()) {
                event.preventDefault();
                $state.go('rooms');
            }

            if (toState.name !== 'main' && !$auth.isAuthenticated()) {
                io.socket.post(API_URL + 'room/leave', { roomName: 'global' }, function(data, res) { });

                event.preventDefault();
                $state.go('main');
            }
        });
    });
