'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:LogoutCtrl
 * @description
 * # LogoutCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('LogoutCtrl', function ($scope, $auth, $state) {
    $auth.logout().then(function() {
        $state.go('main');
    });
});
