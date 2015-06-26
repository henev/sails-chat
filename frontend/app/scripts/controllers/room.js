'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('RoomCtrl', function ($scope, $location, $window, $http, $state, $timeout, $auth, $filter, toastr, RoomService, RoomEventsService, API_URL) {
    $scope.messages = [];
    $scope.users = [];
    $scope.room = {};
    $scope.currentUser = {};
    $scope.typingUsers = [];

    var roomName = $location.search().name;

    RoomService.join(roomName)
        .then(function(response) {
            $scope.room = response.data.room;
            $scope.currentUser = response.data.user;
            $scope.messages = response.messages;
            $scope.users = response.users;
        });

    // Bind event listeners
    RoomEventsService.add();

    // Send a post request to delete the room
    $scope.deleteRoom = function(id) {
        $http.post(API_URL + '/room/destroy', {id: id})
            .then(function(res) {
                toastr.success('You have deleted ' + res.data.name);
                $state.go('rooms');
            })
            .catch(function(res) {
                console.log('Status code: ' + res.status);
                console.log('Status message: ' + res.statusText);
                toastr.error('Unexpected error occurred while deleting the room', 'Error');
            });
    };

    // On create message button click
    $scope.createMessage = function() {
        io.socket.request({
            url: API_URL + '/message/create',
            method: 'POST',
            headers: {
                authorization: 'Bearer ' + $auth.getToken()
            },
            params: {
                text: $scope.text,
                roomId: $scope.room.id
            }
        }, function(data, res) {
            if (res.statusCode !== 200) {
                console.log('Status code: ' + res.statusCode);
                console.log('Error message: ' + data.message);
                toastr.error(data.message, 'Error');
            }
        });

        $scope.text = '';
    };

    $scope.typeMessage = function() {
        io.socket.request({
            url: API_URL + '/room/userTyping',
            method: 'POST',
            headers: {
                authorization: 'Bearer ' + $auth.getToken()
            },
            params: {
                roomName: roomName,
                user: $scope.currentUser
            }
        }, function(data, res) {

        });
    };

    // On scope destroy
    $scope.$on('$destroy', function() {
        // Send to api that user is leaving the room
        RoomService.leave(roomName);
    });
});
