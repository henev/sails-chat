/**
 * MessageController
 *
 * @description :: Server-side logic for managing messages
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var async = require('async');

module.exports = {

	create: function(req, res) {
        var socket = req.socket;
        var text = req.body.text;
        var roomId = req.body.roomId;

        async.waterfall([

            // Find user by socket id (we need the user id for the message)
            function(callback) {
                User.findOne({socket: socket.id})
                    .exec(function(err, user) {
                        if (err) callback({status: 500, message: 'Error creating message'});

                        if (user) {
                            callback(null, user);
                        } else {
                            callback({status: 500, message: 'Error creating message'});
                        }
                    });
            },

            // Create messages
            function(user, callback) {
                // Create new message
                Message.create({
                    text: text,
                    room: roomId,
                    owner: user.id
                }).exec(function(err, msg) {
                    if (err) callback({status: 500, message: 'Error creating message'});

                    callback(null, msg);
                });
            },

            // Find room
            function(msg, callback) {
                // Find the room of the message to add the message to the rooms collection
                Room.findOne({id: roomId})
                    .populate('messages')
                    .exec(function(err, room) {
                        if (err) callback({status: 500, message: 'Error creating message'});

                        if (room) {
                            callback(null, msg, room);
                        } else {
                            callback({status: 500, message: 'Error creating message'});
                        }
                    });
            },

            // Add message to room messages collection and publish updates
            function(msg, room, callback) {
                // Add the new message to the rooms collection of messages
                room.messages.add(msg.id);
                room.save(function(err, savedRoom) {
                    if (err) callback({status: 500, message: 'Error creating message'});

                    // Publish to the sockets that a new message has been created
                    Room.publishAdd(
                        savedRoom.id,
                        'messages',
                        msg.id
                    );

                    callback(null);
                });
            }

        ], function(err) {
            if (err) return res.status(err.status).send({message: err.message});

            res.status(200).end();
        });
    }
};

