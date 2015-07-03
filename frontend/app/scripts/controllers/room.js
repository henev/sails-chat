'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp')
    .controller('RoomCtrl', function ($scope, $location, $timeout, RoomService, MessageService, RoomEventsService) {

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

    // Listen for scope changing events from the room event service
    $scope.$on('addUser', function(event, user) {
        $scope.users.push(user);
    });

    $scope.$on('addTypingUser', function(event, user) {
        $scope.$apply(function() {
            $scope.typingUsers.push(user);
        });
    });

    $scope.$on('removeTypingUser', function(event, index) {
        $scope.typingUsers.splice(index, 1);
    });

    $scope.$on('addMessage', function(event, message) {
        $scope.messages.push(message);

        $timeout(function() {
            var msgContainer = document.getElementById('messages-container');
            msgContainer.scrollTop = msgContainer.scrollHeight;
        });
    });

    $scope.$on('removeUser', function(event, id) {
        $scope.users.forEach(function(user, index) {
            if (user.id === id) {
                $scope.users.splice(index, 1);
            }
        });
    });

    // Update the user's avatar when he uploads a new picture
    $scope.$on('updateUserAvatar', function(event, user) {
        $scope.$apply(function() {
            $scope.messages.forEach(function(message, index) {
                if (message.owner.id === user.id) {
                    $scope.messages[index].owner.avatarUrl = user.avatarUrl;
                }
            });
        });

    });

    // Send a post request to delete the room
    $scope.deleteRoom = function(id) {
        RoomService.deleteRoom(id);
    };

    // On create message button click
    $scope.createMessage = function() {
        MessageService.create($scope.text, $scope.room.id);

        $scope.text = '';
    };

    $scope.typeMessage = function() {
        MessageService.startTyping(roomName, $scope.currentUser)
    };

    // On scope destroy
    $scope.$on('$destroy', function() {
        // Send to api that user is leaving the room
        RoomService.leave(roomName);
    });
});
