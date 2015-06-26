'use strict';

/**
 * @ngdoc function
 * @name sailsChatApp.controller:ProfileCtrl
 * @description
 * # ProfileCtrl
 * Controller of the sailsChatApp
 */
angular.module('sailsChatApp').controller('ProfileCtrl', function ($scope, Upload, API_URL) {
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
                    console.log('file ' + config.file.name + 'uploaded. Response: ' + data);
                });
            }
        }
    };
});
