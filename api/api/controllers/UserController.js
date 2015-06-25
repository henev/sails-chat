/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var request = require('request');
var bcrypt = require('bcrypt-nodejs');

module.exports = {

    login: function(req, res) {
        User.findOne({name: req.body.name}, function (err, user) {
            if (!user) {
                return res.status(401).send({message: 'Wrong email and/or password'});
            }

            bcrypt.compare(req.body.password, user.password, function(err, valid) {
                if (err) return res.status(403);

                if (!valid) {

                    return res.status(401).send({
                        message: 'Email or password invalid'
                    });
                }

                res.send({token: createJWT(user)});
            });
        });
    },

    register: function(req, res) {
        User.findOne({ name: req.body.name }, function(err, existingUser) {

            if (existingUser) {
                return res.status(409).send({ message: 'Name is already taken' });
            }

            User.create({
                name: req.body.name,
                password: req.body.password
            }).exec(function(err, user) {

                res.send({ token: createJWT(user) });
            });
        });
    },

    avatarUpload: function(req, res) {
        req.file('avatar').upload({
            // don't allow the total upload size to exceed ~10MB
            maxBytes: 10000000
        }, function whenDone(err, uploadedFiles) {
            if (err) {

                return res.negotiate(err);
            }

            // If no files were uploaded, respond with an error.
            if (uploadedFiles.length === 0) {

                return res.badRequest('No file was uploaded');
            }

            // Save the "fd" and the url where the avatar for a user can be accessed
            User
                .update(req.userId, {

                    // Generate a unique URL where the avatar can be downloaded.
                    avatarUrl: require('util').format('%s/user/avatar/%s', sails.getBaseUrl(), req.userId),

                    // Grab the first file and use it's `fd` (file descriptor)
                    avatarFd: uploadedFiles[0].fd
                })
                .exec(function (err){
                    if (err) return res.negotiate(err);
                    return res.ok();
                });
        });
    }

};