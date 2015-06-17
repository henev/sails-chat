'use strict';

/**
 * @ngdoc service
 * @name sailsChatApp.socketEvents
 * @description
 * # socketEvents
 * Service in the sailsChatApp.
 */
angular.module('sailsChatApp').service('socketEvents', function ($rootScope, toastr, API_URL) {
    var toast = function(msg) {
        toastr.info(msg);
    };

    var refresh = function(roomName) {
        io.socket.post(API_URL + 'room/users', {
            roomName: roomName
        }, function(data, res) {
            $rootScope.$apply(function() {
                $rootScope.$broadcast('refreshUsers-' + roomName, data);
            });
        });
    };

    return {
        add: function() {
            io.socket.on('toast', toast);
            io.socket.on('refresh', refresh);
        },

        remove: function() {
            io.socket.off('toast', toast);
            io.socket.off('refresh', refresh);
        }
    }
});
