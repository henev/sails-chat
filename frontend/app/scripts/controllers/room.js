'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('RoomCtrl', function ($scope, $location, $http, API_URL) {
    $scope.messages = [];

    var id = $location.search().id;

    $http.get(API_URL + 'rooms?id=' + id)
        .success(function(data) {
            $scope.room = data;

            io.socket.get(API_URL + 'messages?room=' + $scope.room.id, function(data, res) {
                $scope.$apply(function() {
                    console.log(data);
                    $scope.messages = data;
                });
            });
        });

    io.socket.on('message', function(event) {
        $scope.$apply(function() {
            io.socket.post(API_URL + 'messages', { room: $scope.room.id }, function(data, res) {
                $scope.$apply(function() {
                    $scope.messages = data;
                });
            });
        });
    });

    $scope.createMessage = function() {
        io.socket.post(API_URL + 'messages/create', {
            text: $scope.text, room: $scope.room.id
        }, function(data, res) {
            console.log('New message: ' + data.text);
        });
    };
});
