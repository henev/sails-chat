'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('RoomCtrl', function ($scope, $location, $window, $http, $state, $timeout, $auth, $filter, toastr, API_URL) {
    $scope.messages = [];
    $scope.users = [];
    $scope.room = {};
    $scope.currentUser = {};
    $scope.typingUsers = [];

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
        $scope.$apply(function () {
            if (res.statusCode === 200) {
                $scope.room = data.room;
                $scope.currentUser = data.user;

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

                // Get the users for the room
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
                    $scope.$apply(function () {
                        if (res.statusCode === 200) {
                            $scope.users = data;
                        } else {
                            console.log('Status code: ' + res.statusCode);
                            console.log('Error message: ' + data.message);
                            toastr.error(data.message, 'Error');

                            $state.go('rooms');
                        }
                    });
                });
            } else {
                console.log('Status code: ' + res.statusCode);
                console.log('Error message: ' + data.message);
                toastr.error(data.message, 'Error');

                $state.go('rooms');
            }
        });
    });

    // Bind event listeners
    io.socket.on('toast', sendToast);
    io.socket.on('refresh-users', refreshUsers);
    io.socket.on('room', refreshMessages);
    io.socket.on('destroy-room', roomDestroyed);
    io.socket.on('user-typing', userTyping);

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
        io.socket.request({
            url: API_URL + '/message/create',
            method: 'POST',
            headers: {
                authorization: 'Bearer ' + $auth.getToken()
            },
            params: {
                text: $scope.text,
                roomId: $scope.room.id
            }
        }, function(data, res) {
            if (res.statusCode !== 200) {
                console.log('Status code: ' + res.statusCode);
                console.log('Error message: ' + data.message);
                toastr.error(data.message, 'Error');
            }
        });

        $scope.text = '';
    };

    $scope.typeMessage = function() {
        io.socket.request({
            url: API_URL + '/room/userTyping',
            method: 'POST',
            headers: {
                authorization: 'Bearer ' + $auth.getToken()
            },
            params: {
                roomName: roomName,
                user: $scope.currentUser
            }
        }, function(data, res) {

        });
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
            io.socket.off('user-typing', userTyping);

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

    function refreshUsers(res) {
        $scope.$apply(function() {
            switch (res.verb) {
                // User has joined
                case 'joined':
                    $scope.users.push(res.data);
                    break;
                case 'left':
                    $scope.users.forEach(function(user, index) {
                        if (user.id === res.data.id) {
                            $scope.users.splice(index, 1);
                        }
                    });
                    break;
                default:
                    break;
            }
        });
    }

    function refreshMessages(res) {
        // On message model change update the room messages
        $scope.$apply(function() {
            switch (res.verb) {
                // Message is created
                case 'addedTo':
                    if (res.attribute === 'messages') {
                        $http.get(API_URL + '/message?id=' + res.addedId)
                            .then(function(response) {
                                $scope.messages.push(response.data);
                            })
                            .catch(function(response) {
                                console.log('Status code: ' + response.status);
                                console.log('Status message: ' + response.statusText);
                                toastr.error('Unexpected error occurred while getting a new message', 'Error');
                            });
                    }
                    break;
                default:
                    break;
            }
        });
    }

    function roomDestroyed() {
        $state.go('rooms');
    }

    function userTyping(res) {
        $scope.$apply(function() {
            // If array with typing users is empty
            if ($scope.typingUsers.length === 0) {
                // Push the first user
                $scope.typingUsers.push(res);

                // After 1 second remove him
                $scope.typingUsers[0].timeout = $timeout(function() {
                    // Remove the user from the array
                    $scope.typingUsers.splice(0, 1);
                }, 1000);
            } else {
                var isNewUser = true;

                // If array is not empty iterate through all the users and check if the incoming user is already in the array
                for (var user in $scope.typingUsers) {
                    // If user is in the array already
                    if ($scope.typingUsers.hasOwnProperty(user) && $scope.typingUsers[user].name === res.name) {

                        // Cancel the current timeout before the incoming user before it's removed from the array
                        $timeout.cancel($scope.typingUsers[user].timeout);

                        // And add a new timeout of one second (With the cancel works like reset on the timeout)
                        $scope.typingUsers[user].timeout = $timeout(function() {
                            // Get a new index of the existing user because the indexes of the array might be already changed
                            var index = $scope.typingUsers.map(function(e) { return e.id; }).indexOf(res.id);

                            // Remove the user from the array
                            $scope.typingUsers.splice(index, 1);
                        }, 1000);

                        // Indicate the incomming user is already in the array
                        isNewUser = false;

                        break;
                    }
                }

                // If the incoming user is new
                if (isNewUser) {
                    // Add him to the array
                    $scope.typingUsers.push(res);

                    // Get the index of the new user
                    var index = $scope.typingUsers.map(function(e) { return e.id; }).indexOf(res.id);

                    $scope.typingUsers[index].timeout = $timeout(function() {
                        // Get a new index of the existing user because the indexes of the array might be already changed
                        var index = $scope.typingUsers.map(function(e) { return e.id; }).indexOf(res.id);

                        // Remove the user from the array
                        $scope.typingUsers.splice(index, 1);
                    }, 1000);
                }
            }
        });
    }

    //function userTyping(res) {
    //    $scope.$apply(function() {
    //
    //    });
    //}
});
