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
                url: '/room?id',
                templateUrl: '/views/room.html',
                controller: 'RoomCtrl'
            });

        $authProvider.loginUrl = API_URL + 'user/login';
        $authProvider.signupUrl = API_URL + 'user/register';
    })

    .constant('API_URL', 'http://localhost:1337/')

    .run(function($rootScope, API_URL) {
        // TODO: Check state change events and pick the right one
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
            console.log(fromState);
            if (fromState.name === 'rooms') {
                io.socket.post(API_URL + 'rooms/leaveGlobal', {}, function(data, res) { });
            }
        });
    });
