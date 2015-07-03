/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
var bcrypt = require('bcrypt-nodejs');

module.exports = {

    attributes: {
        name: 'string',
        password: 'string',
        socket: 'string',
        rooms: {
            collection: 'room',
            via: 'users'
        },
        avatarUrl: 'string',

        toJSON: function() {
            var user = this.toObject();
            delete user.password;

            return user;
        }
    },

    beforeCreate: function(attributes, next) {
        if (!attributes.password) return next();

        bcrypt.genSalt(10, function(err, salt) {
            if (err) return next(err);

            bcrypt.hash(attributes.password, salt, null, function(err, hash) {
                if (err) return next(err);

                attributes.password = hash;

                next();
            });
        });
    }

};

