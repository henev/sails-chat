'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:ProfileCtrl
 * @description
 * # ProfileCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('ProfileCtrl', function ($scope, $http, Upload, toastr, API_URL) {
    $scope.user = {};

    $http.get(API_URL + '/user/byJwt')
        .then(function(res) {
            $scope.user = res.data;
        })
        .catch(function(res) {

        });

    $scope.uploadAvatar = function(files) {
        if (files && files.length) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                Upload.upload({
                    url: API_URL + '/user/avatarUpload',
                    file: file,
                    fileName: file.name,
                    fileFormDataName: 'avatar'
                }).progress(function (evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                }).success(function (data, status, headers, config) {
                    $scope.avatar = null;
                    $scope.user.avatarUrl = data.avatarUrl;
                    toastr.success('You now have a new avatar', 'Upload successful');
                });
            }
        }
    };
});
