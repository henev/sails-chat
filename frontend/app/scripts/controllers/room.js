'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('RoomCtrl', function ($scope, $location, $window, $http, toastr, API_URL) {
    $scope.messages = [];
    $scope.users = [];
    $scope.room = {};

    var roomName = $location.search().name;

    io.socket.post(API_URL + 'room/join', {
        roomName: roomName,
        token: $window.localStorage.satellizer_token
    }, function(data, res) {
        $scope.$apply(function() {
            $scope.room = data;

            // Get the messages for the room
            $http.get(API_URL + 'message?room=' + $scope.room.id)
                .success(function(messages) {
                    $scope.messages = messages;
                });
        });
    });

    // Bind event listeners
    io.socket.on('toast', sendToast);
    io.socket.on('refresh', refreshUsers);
    io.socket.on('room', refreshMessages);

    // On create message button click
    $scope.createMessage = function() {
        io.socket.post(API_URL + 'message/create', {
            text: $scope.text,
            roomId: $scope.room.id
        });
    };

    // On scope destroy
    $scope.$on('$destroy', function() {
        // Send to api that user is leaving the room
        io.socket.post(API_URL + 'room/leave', { roomName: roomName }, function() {
            // Unbind event listeners
            io.socket.off('toast', sendToast);
            io.socket.off('refresh', refreshUsers);
            io.socket.off('room', refreshMessages);
        });
    });

    // Callback function to bind to new toast event
    function sendToast(msg) {
        toastr.info(msg);
    }

    function refreshUsers() {
        io.socket.post(API_URL + 'room/users', {
            roomName: roomName
        }, function(data, res) {
            $scope.$apply(function() {
                $scope.users = data;
            });
        });
    }

    function refreshMessages(event) {
        console.log(event);

        // On message model change update the room messages
        $scope.$apply(function() {
            $http.get(API_URL + 'message?room=' + $scope.room.id)
                .success(function(messages) {
                    $scope.messages = messages;
                });
        });
    }
});
