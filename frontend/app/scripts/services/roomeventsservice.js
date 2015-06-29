'use strict';

/**
 * @ngdoc service
 * @name sailsChatApp.RoomEventsService
 * @description
 * # RoomEventsService
 * Service in the sailsChatApp.
 */
angular.module('sailsChatApp').service('RoomEventsService', function ($rootScope, $http, $state, $timeout, toastr, API_URL) {
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
        switch (res.verb) {
            // User has joined
            case 'joined':
                $rootScope.$broadcast('addUser', res.data);
                break;
            case 'left':
                $rootScope.$broadcast('removeUser', res.data.id);
                break;
            default:
                break;
        }
    }

    function refreshMessages(res) {
        // On message model change update the room messages
        switch (res.verb) {
            // Message is created
            case 'addedTo':
                if (res.attribute === 'messages') {
                    $http.get(API_URL + '/message?id=' + res.addedId)
                        .then(function(response) {
                            $rootScope.$broadcast('addMessage', response.data);
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
    }

    function roomDestroyed() {
        $state.go('rooms');
    }

    var typingUsers = [];
    function userTyping(res) {
        // If array with typing users is empty
        if (typingUsers.length === 0) {
            // Push the first user
            $rootScope.$broadcast('addTypingUser', res);
            typingUsers.push(res);

            // After 1 second remove him
            typingUsers[0].timeout = $timeout(function() {
                // Remove the user from the array
                typingUsers.splice(0, 1);
                $rootScope.$broadcast('removeTypingUser', 0);
            }, 1000);
        } else {
            var isNewUser = true;

            // If array is not empty iterate through all the users and check if the incoming user is already in the array
            for (var user in typingUsers) {
                // If user is in the array already
                if (typingUsers.hasOwnProperty(user) && typingUsers[user].name === res.name) {

                    // Cancel the current timeout before the incoming user before it's removed from the array
                    $timeout.cancel(typingUsers[user].timeout);

                    // And add a new timeout of one second (With the cancel works like reset on the timeout)
                    typingUsers[user].timeout = $timeout(function() {
                        // Get a new index of the existing user because the indexes of the array might be already changed
                        var index = typingUsers.map(function(e) { return e.id; }).indexOf(res.id);

                        // Remove the user from the array
                        typingUsers.splice(index, 1);
                        $rootScope.$broadcast('removeTypingUser', index);
                    }, 1000);

                    // Indicate the incomming user is already in the array
                    isNewUser = false;

                    break;
                }
            }

            // If the incoming user is new
            if (isNewUser) {
                // Add him to the array
                typingUsers.push(res);
                $rootScope.$broadcast('addTypingUser', res);

                // Get the index of the new user
                var index = typingUsers.map(function(e) { return e.id; }).indexOf(res.id);

                typingUsers[index].timeout = $timeout(function() {
                    // Get a new index of the existing user because the indexes of the array might be already changed
                    var index = typingUsers.map(function(e) { return e.id; }).indexOf(res.id);

                    // Remove the user from the array
                    typingUsers.splice(index, 1);
                    $rootScope.$broadcast('removeTypingUser', index);
                }, 1000);
            }
        }
    }
});
