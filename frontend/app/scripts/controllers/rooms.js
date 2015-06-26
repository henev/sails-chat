'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('RoomsCtrl', function ($scope, $state, RoomService, API_URL) {
    $scope.rooms = [];

    // Bind event to room model to listen for room changes
    io.socket.on('room', handleRoomChanges);

    RoomService.getRooms()
        .then(function(data) {
            $scope.rooms = data;
        });

    // Enter a already created room or create a new one
    $scope.enterRoom = function(name) {
        $state.go('room', { name: name });
    };

    // On scope destroy
    $scope.$on('$destroy', function() {
        // Remove event listeners and unsubscribe socket from Model events
        io.socket.off('room', handleRoomChanges);
        io.socket.get(API_URL + '/room/unsubscribe');
    });

    // Callback function to bind to room model changes
    function handleRoomChanges(res) {
        $scope.$apply(function() {
            switch (res.verb) {
                // Room is created
                case 'created':
                    $scope.rooms.push(res.data);
                    break;
                // Room is deleted
                case 'destroyed':
                    $scope.rooms.forEach(function(room, index) {
                        if (room.id === res.id) {
                            $scope.rooms.splice(index, 1);

                            return false;
                        }
                    });
                    break;
                default:
                    break;
            }
        });
    }
});
