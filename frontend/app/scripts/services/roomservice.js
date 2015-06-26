'use strict';

/**
 * @ngdoc service
 * @name sailsChatApp.RoomService
 * @description
 * # RoomService
 * Service in the sailsChatApp.
 */
angular.module('sailsChatApp').service('RoomService', function ($q, $auth, toastr, MessageService, $state, RoomEventsService, API_URL) {
    this.getRooms = function() {
        var deferred = $q.defer();

        io.socket.request({
            url: API_URL + '/room',
            method: 'GET',
            headers: {
                authorization: 'Bearer ' + $auth.getToken()
            }
        }, function(data, res) {
            if (res.statusCode === 200) {
                deferred.resolve(data);
            } else {
                console.log('Status code: ' + res.statusCode);
                console.log('Error message: ' + data.message);
                toastr.error('Unexpected error occurred while loading the rooms', 'Error');

                deferred.reject({
                    res: res,
                    data: data
                });
            }
        });

        return deferred.promise;
    };

    this.join = function(roomName) {
        var deferred = $q.defer();
        var self = this;

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
                // Success messages on creating a new room
                if (data.isNew) {
                    toastr.success('You have created a new room');
                }

                // Get room's messages
                MessageService.getMessagesByRoom(data.room.id)
                    .then(function(messages) {

                        // Get room's users without the one who just joined
                        self.getRoomUsersWithoutRequestSocket(data.room.name)
                            .then(function(users) {
                                deferred.resolve({
                                    data: data,
                                    messages:messages.data,
                                    users:users
                                });
                            })
                            .catch(function(response) {
                                deferred.reject({
                                    res: response.res,
                                    data: response.data
                                });
                            });

                    })
                    .catch(function(response) {
                        deferred.reject({
                            res: response.res,
                            data: response.data
                        });
                    });

            } else {
                console.log('Status code: ' + res.statusCode);
                console.log('Error message: ' + data.message);
                toastr.error(data.message, 'Error');

                $state.go('rooms');

                deferred.reject({
                    res: res,
                    data: data
                });
            }
        });

        return deferred.promise;
    };

    this.leave = function(roomName) {
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
            RoomEventsService.remove();

            if (res.statusCode !== 200) {
                console.log('Status code: ' + res.statusCode);
                console.log('Error message: ' + data.message);
                toastr.error(data.message, 'Error');
            }
        });
    };

    this.getRoomUsersWithoutRequestSocket = function(roomName) {
        var deferred = $q.defer();

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
            if (res.statusCode === 200) {
                deferred.resolve(data);
            } else {
                console.log('Status code: ' + res.statusCode);
                console.log('Error message: ' + data.message);
                toastr.error(data.message, 'Error');

                $state.go('rooms');
                deferred.reject({
                    res: res,
                    data: data
                });
            }
        });

        return deferred.promise;
    };
});
