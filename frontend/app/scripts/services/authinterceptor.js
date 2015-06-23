'use strict';

/**
 * @ngdoc service
 * @name psJwtApp.authInterceptor
 * @description
 * # authInterceptor
 * Factory in the psJwtApp.
 */
angular.module('sailsChatApp').factory('authInterceptor', function ($auth) {

    return {
        request: function (config) {
            var token = $auth.getToken();

            if (token) {
                config.headers.Authorization = 'Bearer ' + token;
            }

            return config;
        },
        response: function(response) {

            return response;
        }
    };
});