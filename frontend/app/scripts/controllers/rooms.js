'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('RoomsCtrl', function ($rootScope, $scope, $state, $window, toastr, socketEvents, API_URL) {
    $scope.users = [];
    $scope.rooms = [];

    var roomName = 'global';

    // Add the io.socket.on event listeners
    socketEvents.add();

    // Watch for rootScope users change from socket refresh event
    $rootScope.$on('refreshUsers-' + roomName, function(event, args) {
        $scope.users = args;
    });

    // Bind event to room model to listen for room changes
    io.socket.on('room', function(event) {
        $scope.$apply(function() {
            io.socket.get(API_URL + 'room', function(data, res) {
                $scope.$apply(function() {
                    $scope.rooms = data;
                });
            });
        });
    });

    // Get all rooms and and subscribe the socket to their changes
    io.socket.get(API_URL + 'room', function(data, res) {
        $scope.$apply(function() {
            $scope.rooms = data;
        });
    });

    // Enter a already created room or create a new one
    $scope.enterRoom = function(name) {
        $state.go('room', { name: name });
    };

    // Send user authentication to indicate user has joined the room
    io.socket.post(API_URL + 'room/join', {
        roomName: roomName,
        token: $window.localStorage.satellizer_token
    }, function(data, res) { });

});
