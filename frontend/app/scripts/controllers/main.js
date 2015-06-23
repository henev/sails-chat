'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('MainCtrl', function ($scope, $state, $auth, toastr) {
    $scope.login = function() {
        $auth.login({ name: $scope.log.name, password: $scope.log.password })
            .then(function() {
                $state.go('rooms');
            })
            .catch(function(res) {
                console.log('Status code: ' + res.status);
                console.log('Status message: ' + res.statusText);
                toastr.error(res.data.message, 'Error');
            });
    };

    $scope.register = function() {
        $auth
            .signup({
                name: $scope.reg.name,
                password: $scope.reg.password
            })
            .then(function() {
                $state.go('rooms');
            })
            .catch(function(res) {
                console.log('Status code: ' + res.status);
                console.log('Status message: ' + res.statusText);
                toastr.error(res.data.message, 'Error');
            });
    };
});
