'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('RoomsCtrl', function ($rootScope, $scope, $state, $window, toastr, socketEvents, API_URL) {
    $scope.rooms = [];

    // Bind event to room model to listen for room changes
    io.socket.on('room', function(event) {
        console.log(event);

        $scope.$apply(function() {
            io.socket.get(API_URL + 'room', function(data, res) {
                $scope.$apply(function() {
                    $scope.rooms = data;
                });
            });
        });
    });

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

});
