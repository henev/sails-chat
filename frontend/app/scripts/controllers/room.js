'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('RoomCtrl', function ($rootScope, $scope, $location, $window, $http, API_URL, socketEvents) {
    $scope.messages = [];
    $scope.users = [];
    $scope.room = {};

    var roomName = $location.search().name;

    // Add the io.socket.on event listeners
    socketEvents.add();

    // Watch for rootScope users change from socket refresh event
    $rootScope.$on('refreshUsers-' + roomName, function(event, args) {
        $scope.users = args;
    });

    io.socket.post(API_URL + 'room/join', {
        roomName: roomName,
        token: $window.localStorage.satellizer_token
    }, function(data, res) {
        $scope.$apply(function() {
            $scope.room = data;

            // Get the messages for the room
            io.socket.get(API_URL + 'message?room=' + $scope.room.id, function(data, res) {
                $scope.$apply(function() {
                    $scope.messages = data;
                });
            });
        });
    });

    io.socket.on('message', function(event) {
        // On message model change update the room messages
        $scope.$apply(function() {
            io.socket.get(API_URL + 'message?room=' + $scope.room.id, function(data, res) {
                $scope.$apply(function() {
                    $scope.messages = data;
                });
            });
        });
    });

    $scope.createMessage = function() {
        io.socket.post(API_URL + 'message/create', {
            text: $scope.text,
            roomId: $scope.room.id
        }, function(data, res) { });
    };
});
