'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('RoomsCtrl', function ($scope, $state, $window, toastr, API_URL) {
    $scope.users = [];
    $scope.rooms = [];
    var currentUser = {};

    var roomName = 'global';

    //io.socket.on('user', function(event) {
    //    console.log(event);
    //    $scope.$apply(function() {
    //        io.socket.get(API_URL + 'users', function(data, res) {
    //            //console.log(data);
    //            //console.log(res);
    //            $scope.$apply(function() {
    //                $scope.users = data;
    //            });
    //        });
    //    });
    //});
    //
    //io.socket.get(API_URL + 'user', function(data, res) {
    //    //console.log(data);
    //    //console.log(res);
    //    $scope.$apply(function() {
    //        $scope.users = data;
    //    });
    //});

    io.socket.on('room', function(event) {
        $scope.$apply(function() {
            io.socket.get(API_URL + 'room', function(data, res) {
                $scope.$apply(function() {
                    $scope.rooms = data;
                });
            });
        });
    });

    io.socket.get(API_URL + 'room', function(data, res) {
        $scope.$apply(function() {
            $scope.rooms = data;
        });
    });

    io.socket.on('toast', function(user) {
        toastr.info(user.name + ' joined the ' + roomName + ' room', 'Information');
    });

    io.socket.on('refresh', function() {
        io.socket.post(API_URL + 'room/users', {
            roomName: roomName
        }, function(data, res) {
            $scope.$apply(function() {
                $scope.users = data;
            });
        });
    });

    $scope.createRoom = function() {
        io.socket.post(API_URL + 'room/create', { name: $scope.roomName }, function(data, res) {
            $state.go('room', {
                id: data.id
            });
        });
    };

    $scope.enterRoom = function(roomId) {
        //io.socket.post(API_URL + 'room/');

        $state.go('room', { id: roomId });
    };

    io.socket.post(API_URL + 'room/join', {
        roomName: roomName,
        token: $window.localStorage.satellizer_token
    }, function(data, res) {
        currentUser = data;
    });
});
