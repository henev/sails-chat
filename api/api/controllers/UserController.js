/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var request = require('request');
var bcrypt = require('bcrypt-nodejs');
var fs = require('fs');
var util = require('util');
var mkdirp = require('mkdirp');

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

    avatarUpload: function(req, res){

        if (req.method === 'POST') {

            var tempLocation = process.cwd() + '/.tmp/public/images/uploads/';

            // Make sure there is such dir under the .tmp folder
            // If not -> create one
            mkdirp(tempLocation, function(err) {
                if (err) return res.send(500, err);

                // Start uploading the image
                req.file('avatar').upload({
                    dirname : process.cwd() + '/assets/images/uploads/'
                }, function (err, uploadedFiles) {
                    if (err) return res.send(500, err);

                    // If no files were uploaded, respond with an error.
                    if (uploadedFiles.length === 0) return res.badRequest('No file was uploaded');

                    var filename = uploadedFiles[0].fd.substring(uploadedFiles[0].fd.lastIndexOf('/') + 1);
                    var uploadLocation = process.cwd() +'/assets/images/uploads/';

                    //Copy the file to the temp folder so that it becomes available immediately
                    var stream = fs.createReadStream(uploadLocation + filename)
                        .pipe(fs.createWriteStream(tempLocation + filename));

                    // Handle errors from the file stream
                    stream.on('error', function (error) {
                        console.log("Caught", error);
                    });

                    // Find the user
                    User
                        .findOne({id: req.userId})
                        .exec(function (err, foundUser) {
                            if (err) return res.send(500, err);

                            // Delete the old file
														if (foundUser.avatarUrl) {
															var oldFile = foundUser.avatarUrl.substring(foundUser.avatarUrl.lastIndexOf('/') + 1);
                            	var deleteLocation = uploadLocation + oldFile;
															fs.unlink(deleteLocation, function (err) {
                               if (err) throw err;
                                saveNewPorfilePicture(foundUser, res, filename);
                            	});
														} else {
															saveNewPorfilePicture(foundUser, res, filename);
														}
                        });
                });
            });

        } else {

            res.ok();

        }
    },

    byJwt: function(req, res) {
        User
            .findOne({id: req.userId})
            .exec(function(err, user) {
                if (err) return res.send(500, err);

                res.status(200).json(user);
            });
    }

};

function saveNewPorfilePicture(user, res, filename) {
	// Set a new avatar url to the user model
	user.avatarUrl = util.format('%s/images/uploads/%s', sails.getBaseUrl(), filename);
	user.save(function (err, user) {
		if (err) return res.send(500, err);

		sails.sockets.blast('user-avatar-changed', {
			id: user.id,
			avatarUrl: user.avatarUrl
		});

		// Return the avatar image url
		return res.status(200).send({
			avatarUrl: user.avatarUrl
		});
	});
}