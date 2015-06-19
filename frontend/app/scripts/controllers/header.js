'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:HeaderCtrl
 * @description
 * # HeaderCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('HeaderCtrl', function ($scope, $auth) {
    $scope.isAuthenticated = $auth.isAuthenticated;
});
