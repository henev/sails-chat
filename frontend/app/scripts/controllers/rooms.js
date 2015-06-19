'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('RoomsCtrl', function ($scope, $state, $http, API_URL) {
    $scope.rooms = [];

    // Bind event to room model to listen for room changes
    io.socket.on('room', refreshRooms);

    // Get all rooms and and subscribe the socket to their changes
    io.socket.get(API_URL + 'room', function(data, res) {
        $scope.$apply(function() {
            $scope.rooms = data;
        });
    });

    // Enter a already created room or create a new one
    $scope.enterRoom = function(name) {
        $state.go('room', { name: name });
    };

    // On scope destroy
    $scope.$on('$destroy', function() {
        // Remove event listeners and unsubscribe socket from Model events
        io.socket.off('room', refreshRooms);
        io.socket.get(API_URL + 'room/unsubscribe');
    });

    // Callback function to bind to room model changes
    function refreshRooms() {
        $scope.$apply(function() {
            $http.get(API_URL + 'room')
                .then(function(rooms) {
                    $scope.rooms = rooms.data;
                });
        });
    }
});
