'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('RoomCtrl', function ($scope, $location, $window, $http, $state, $timeout, $auth, toastr, API_URL) {
    $scope.messages = [];
    $scope.users = [];
    $scope.room = {};
    $scope.userId = '';

    var roomName = $location.search().name;

    io.socket.request({
        url: API_URL + '/room/join',
        method: 'POST',
        headers: {
            authorization: 'Bearer ' + $auth.getToken()
        },
        params: {
            roomName: roomName,
            token: $auth.getToken()
        }
    }, function(data, res) {
        if (res.statusCode === 200) {
            $scope.$apply(function () {
                $scope.room = data.room;
                $scope.userId = data.userId;

                if (data.isNew) {
                    toastr.success('You have created a new room');
                }

                // Get the messages for the room
                $http.get(API_URL + '/message?room=' + $scope.room.id)
                    .then(function (messages) {
                        $scope.messages = messages.data;

                        // When the digest is over and the messages are rendered in the browser
                        // Scroll to the bottom of the container
                        $timeout(function() {
                            var msgContainer = document.getElementById('messages-container');
                            msgContainer.scrollTop = msgContainer.scrollHeight;
                        });
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
    io.socket.on('refresh-users', refreshUsers);
    io.socket.on('room', refreshMessages);
    io.socket.on('destroy-room', roomDestroyed);

    // Send a post request to delete the room
    $scope.deleteRoom = function(id) {
        $http.post(API_URL + '/room/destroy', {id: id})
            .then(function(res) {
                toastr.success('You have deleted ' + res.data.name);
                $state.go('rooms');
            })
            .catch(function(res) {
                console.log('Status code: ' + res.status);
                console.log('Status message: ' + res.statusText);
                toastr.error('Unexpected error occurred while deleting the room', 'Error');
            });
    };

    // On create message button click
    $scope.createMessage = function() {
        io.socket.post(API_URL + '/message/create', {
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
        io.socket.request({
            url: API_URL + '/room/leave',
            method: 'POST',
            headers: {
                authorization: 'Bearer ' + $auth.getToken()
            },
            params: {
                roomName: roomName
            }
        }, function(data, res) {
            // Unbind event listeners
            io.socket.off('toast', sendToast);
            io.socket.off('refresh', refreshUsers);
            io.socket.off('room', refreshMessages);
            io.socket.off('destroy-room', roomDestroyed);

            if (res.statusCode !== 200) {
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
        io.socket.request({
            url: API_URL + '/room/users',
            method: 'POST',
            headers: {
                authorization: 'Bearer ' + $auth.getToken()
            },
            params: {
                roomName: roomName
            }
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
                .get(API_URL + '/message?room=' + $scope.room.id)
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

    function roomDestroyed() {
        $state.go('rooms');
    }
});
