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
    }

};