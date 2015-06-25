'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('RoomsCtrl', function ($scope, $state, $http, $auth, toastr, API_URL) {
    $scope.rooms = [];

    // Bind event to room model to listen for room changes
    io.socket.on('room', handleRoomChanges);

    io.socket.request({
        url: API_URL + '/room',
        method: 'GET',
        headers: {
            authorization: 'Bearer ' + $auth.getToken()
        }
    }, function(data, res) {
        if (res.statusCode === 200) {
            $scope.$apply(function() {
                $scope.rooms = data;
            });
        } else {
            console.log('Status code: ' + res.statusCode);
            console.log('Error message: ' + data.message);
            toastr.error('Unexpected error occurred while loading the rooms', 'Error');
        }
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
