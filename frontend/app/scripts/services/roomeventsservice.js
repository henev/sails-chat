'use strict';

/**
 * @ngdoc service
 * @name sailsChatApp.RoomEventsService
 * @description
 * # RoomEventsService
 * Service in the sailsChatApp.
 */
angular.module('sailsChatApp').service('RoomEventsService', function ($http, $state, toastr) {
    this.add = function() {
        io.socket.on('toast', sendToast);
        io.socket.on('refresh-users', refreshUsers);
        io.socket.on('room', refreshMessages);
        io.socket.on('destroy-room', roomDestroyed);
        io.socket.on('user-typing', userTyping);
    };

    this.remove = function() {
        io.socket.off('toast', sendToast);
        io.socket.off('refresh', refreshUsers);
        io.socket.off('room', refreshMessages);
        io.socket.off('destroy-room', roomDestroyed);
        io.socket.off('user-typing', userTyping);
    };

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
});
