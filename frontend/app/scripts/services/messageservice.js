'use strict';

/**
 * @ngdoc service
 * @name sailsChatApp.MessageService
 * @description
 * # MessageService
 * Service in the sailsChatApp.
 */
angular.module('sailsChatApp').service('MessageService', function ($q, $http, $timeout, $state, $auth, toastr, API_URL) {
    this.getMessagesByRoom = function(roomId) {
        var deferred = $q.defer();

        // Get the messages for the room
        $http.get(API_URL + '/message?room=' + roomId)
            .then(function (data) {
                // When the digest is over and the messages are rendered in the browser
                // Scroll to the bottom of the container
                $timeout(function() {
                    var msgContainer = document.getElementById('messages-container');
                    msgContainer.scrollTop = msgContainer.scrollHeight;
                });

                deferred.resolve(data);
            })
            .catch(function(res) {
                console.log('Status code: ' + res.status);
                console.log('Status message: ' + res.statusText);
                toastr.error('Unexpected error occurred while loading the messages', 'Error');

                $state.go('rooms');

                deferred.reject(res);
            });

        return deferred.promise;
    };

    this.create = function(text, roomId) {
        io.socket.request({
            url: API_URL + '/message/create',
            method: 'POST',
            headers: {
                authorization: 'Bearer ' + $auth.getToken()
            },
            params: {
                text: text,
                roomId: roomId
            }
        }, function(data, res) {
            if (res.statusCode !== 200) {
                console.log('Status code: ' + res.statusCode);
                console.log('Error message: ' + data.message);
                toastr.error(data.message, 'Error');
            }
        });
    };

    this.startTyping = function(roomName, user) {
        io.socket.request({
            url: API_URL + '/room/userTyping',
            method: 'POST',
            headers: {
                authorization: 'Bearer ' + $auth.getToken()
            },
            params: {
                roomName: roomName,
                user: user
            }
        });
    };
});
