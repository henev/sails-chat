'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('MainCtrl', function ($scope, $http, API_URL) {
    $scope.users = [];
    $scope.rooms = [];

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
    //io.socket.get(API_URL + 'users', function(data, res) {
    //    //console.log(data);
    //    //console.log(res);
    //    $scope.$apply(function() {
    //        $scope.users = data;
    //    });
    //});

    io.socket.on('room', function(event) {
        console.log(event);
        $scope.$apply(function() {
            io.socket.get(API_URL + 'rooms', function(data, res) {
                //console.log(data);
                //console.log(res);
                $scope.$apply(function() {
                    $scope.rooms = data;
                });
            });
        });
    });

    io.socket.get(API_URL + 'rooms', function(data, res) {
        //console.log(data);
        //console.log(res);
        $scope.$apply(function() {
            $scope.rooms = data;
        });
    });
});
