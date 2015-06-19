'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('RoomCtrl', function ($scope, $location, $window, $http, $state, toastr, API_URL) {
    $scope.messages = [];
    $scope.users = [];
    $scope.room = {};
    $scope.userId = '';

    var roomName = $location.search().name;

    io.socket.post(API_URL + 'room/join', {
        roomName: roomName,
        token: $window.localStorage.satellizer_token
    }, function(data, res) {
        if (res.statusCode === 200) {
            $scope.$apply(function () {
                $scope.room = data.room;
                $scope.userId = data.userId;

                if (data.isNew) {
                    toastr.success('You have created a new room');
                }

                // Get the messages for the room
                $http
                    .get(API_URL + 'message?room=' + $scope.room.id)
                    .then(function (messages) {
                        $scope.messages = messages.data;
                    })
                    .catch(function(res) {
                        console.log('Status code: ' + res.status);
                        console.log('Status message: ' + res.statusText);
                        toastr.error('Unexpected error occurred while loading the messages', 'Error');

                        $state.go('rooms');
                    });
            });
        } else {
            console.log('Status code: ' + res.statusCode);
            console.log('Error message: ' + data.message);
            toastr.error(data.message, 'Error');

            $state.go('rooms');
        }
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
        }, function(data, res) {
            if (res.statusCode !== 200) {
                console.log('Status code: ' + res.statusCode);
                console.log('Error message: ' + data.message);
                toastr.error(data.message, 'Error');
            }
        });

        $scope.text = '';
    };

    // On scope destroy
    $scope.$on('$destroy', function() {
        // Send to api that user is leaving the room
        io.socket.post(API_URL + 'room/leave', { roomName: roomName }, function(data, res) {
            if (res.statusCode === 200) {
                // Unbind event listeners
                io.socket.off('toast', sendToast);
                io.socket.off('refresh', refreshUsers);
                io.socket.off('room', refreshMessages);
            } else {
                console.log('Status code: ' + res.statusCode);
                console.log('Error message: ' + data.message);
                toastr.error(data.message, 'Error');
            }
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
            if (res.statusCode === 200) {
                $scope.$apply(function() {
                    $scope.users = data;
                });
            } else {
                console.log('Status code: ' + res.status);
                console.log('Status message: ' + res.statusText);
                toastr.error('Unexpected error occurred while reloading the room users', 'Error');
            }
        });
    }

    function refreshMessages() {
        // On message model change update the room messages
        $scope.$apply(function() {
            $http
                .get(API_URL + 'message?room=' + $scope.room.id)
                .then(function(messages) {
                    $scope.messages = messages.data;
                })
                .catch(function(res) {
                    console.log('Status code: ' + res.status);
                    console.log('Status message: ' + res.statusText);
                    toastr.error('Unexpected error occurred while reloading the messages', 'Error');
                });
        });
    }
});
