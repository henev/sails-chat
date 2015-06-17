'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('RoomCtrl', function ($rootScope, $scope, $location, $window, $http, API_URL, socketEvents) {
    $scope.messages = [];
    $scope.users = [];
    $scope.room = {};

    var roomName = $location.search().name;

    // Add the io.socket.on event listeners
    socketEvents.add();

    // Watch for rootScope users change from socket refresh event
    $rootScope.$on('refreshUsers-' + roomName, function(event, args) {
        $scope.users = args;
    });

    io.socket.post(API_URL + 'room/join', {
        roomName: roomName,
        token: $window.localStorage.satellizer_token
    }, function(data, res) {
        $scope.$apply(function() {
            $scope.room = data;
        });
    });

    //io.socket.get(API_URL + 'messages?room=' + $scope.room.id, function(data, res) {
    //    $scope.$apply(function() {
    //        console.log(data);
    //        $scope.messages = data;
    //    });
    //});

    //io.socket.on('message', function(event) {
    //    $scope.$apply(function() {
    //        io.socket.post(API_URL + 'messages', { room: $scope.room.id }, function(data, res) {
    //            $scope.$apply(function() {
    //                $scope.messages = data;
    //            });
    //        });
    //    });
    //});
    //
    //$scope.createMessage = function() {
    //    io.socket.post(API_URL + 'messages/create', {
    //        text: $scope.text, room: $scope.room.id
    //    }, function(data, res) {
    //        console.log('New message: ' + data.text);
    //    });
    //};
});
