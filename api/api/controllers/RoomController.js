/**
 * RoomController
 *
 * @description :: Server-side logic for managing rooms
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var jwt = require('jwt-simple');
var q = require('q');
var async = require('async');

module.exports = {

    join: function(req, res) {
        var token = req.body.token;
        var roomName = req.body.roomName;
        var socket = req.socket;
        var payload = jwt.decode(token, config.TOKEN_SECRET);
        var userId = payload.sub;
        var deferred = q.defer();

        async.waterfall([
            // Find user
            function(callback) {
                User.findOne({id: userId})
                    .populate('rooms')
                    .exec(function(err, user) {
                        if (err) callback({status: 401, message: 'Authorization failed'});

                        if (user) {
                            callback(null, user);
                        } else {
                            callback({status: 401, message: 'Authorization failed'});
                        }
                    });
            },

            // Add the socket id to his account and find the room
            function(user, callback) {

                // Save the socket to the user in db
                user.socket = socket.id;
                user.save(function (err, user) {
                    if (err) callback({status: 500, message: 'Unable to join the room'});
                    // Create / find room and add the user to it if he is not already in
                    Room.findOne({name: roomName}, function(err, room) {
                        if (err) callback({status: 404, message: 'Unable to join the room'});

                        callback(null, user, room);
                    });
                });

                // Sails.sockets events to other users in the room once the user has joined
                deferred.promise.then(function(room) {
                    // Joins/Subscribes user to the room
                    sails.sockets.join(socket, roomName);
                    // Broadcast a msg to other users in that room notifying for the new user
                    sails.sockets.broadcast(roomName, 'toast', user.name + ' has entered the ' + roomName + ' room', socket);
                    // Refreshes every subscriber's user view
                    sails.sockets.broadcast(roomName, 'refresh-users', {data: user, verb: 'joined'}, socket);

                    Room.subscribe(socket, room);
                });
            },

            // Create or update an existing room with the user
            function(user, room, callback) {
                if (!room) {
                    // Create room and add user
                    Room.create({
                        name: roomName,
                        owner: user.id
                    }).exec(function(err, newRoom) {
                        if (err) callback({status: 500, message: 'Unable to join the room'});

                        newRoom.users.add(user.id);
                        newRoom.save(function(err, savedRoom) {
                            if (err) callback({status: 500, message: 'Unable to join the room'});

                            // Send a msg to all subscribers to room model to update their rooms
                            Room.publishCreate({id: savedRoom.id, name: savedRoom.name});
                            deferred.resolve(savedRoom);

                            callback(null, {
                                room: savedRoom,
                                user: user,
                                isNew: true
                            });
                        });
                    });
                } else {
                    // Check if user is already in (subscribed to) room
                    var userIsInRoom = findInObjectArray(user.rooms, 'id', room.id);

                    // Adds (subscribes) him if he is not in the room
                    if (!userIsInRoom) {
                        room.users.add(user.id);
                        room.save(function(err, savedRoom) {
                            if (err) callback({status: 500, message: 'Unable to join the room'});

                            deferred.resolve(savedRoom);

                            callback(null, {
                                room: savedRoom,
                                user: user,
                                isNew: false
                            });
                        });
                    }
                }
            }
        ], function(err, result) {
            if (err) return res.status(err.status).send({message: err.message});

            res.status(200).send({
                room: result.room,
                user: result.user,
                isNew: result.isNew
            });
        })
    },

    leave: function(req, res) {
        var roomName = req.body.roomName;
        var socket = req.socket;

        async.waterfall([
            // Find user
            function(callback) {
                User.findOne({socket: socket.id})
                    .populate('rooms', {name: roomName})
                    .exec(function(err, user) {
                        if (err) callback({status: 500, message: 'Unexpected error occurred'});

                        callback(null, user)
                    });
            },

            // Remove room from user's rooms
            function(user, callback) {
                if (user) {
                    if (user.rooms.length > 0) {
                        var foundRoom = user.rooms[0];

                        user.rooms.remove(foundRoom.id);
                        user.save(function(err, savedUser) {
                            if (err) callback({status: 500, message: 'Unexpected error occurred'});

                            callback(null, savedUser, foundRoom);
                        });
                    } else {
                        // This will probably happen if the room was already deleted and the user is kicked from it
                        callback(null, null, null);
                    }
                } else {
                    callback({status: 404, message: 'Unexpected error occurred'});
                }
            },

            // Socket leaves the sails.sockets room and messages are broadcasted to the other subscribers of the room
            // Also the socket is unsubscribed from the room's model instance events
            function(user, room, callback) {
                if (room !== null && user !== null) {
                    sails.sockets.leave(socket, roomName);
                    sails.sockets.broadcast(roomName, 'refresh-users', {data: user, verb: 'left'}, socket);
                    sails.sockets.broadcast(roomName, 'toast', user.name + ' has left the ' + roomName + ' room', socket);

                    Room.unsubscribe(socket, room);
                }

                callback(null);
            }

        // Handle the errors or the end of the waterfall chain
        ], function(err) {
            if (err) return res.status(err.status).send({message: err.message});

            res.status(200).end();
        })
    },

    users: function(req, res) {
        var roomName = req.body.roomName;
        var socket = req.socket;

        // get subscribed sockets to the room
        var sockets = sails.sockets.subscribers(roomName);
        // Remove the user that is sending the request.
        // We don't want the user that is sending the request to see himself.
        var index = sockets.indexOf(socket.id.toString());
        if (index > -1) {
            sockets.splice(index, 1);
        }

        // Get all subscribers in the room by sockets
        User.find({socket: sockets}, function(err, users) {
            if (err) return res.status(500).send({message: 'Unexpected error occurred'});

            res.status(200).json(users);
        });
    },

    unsubscribe: function(req, res) {
        Room.find({}, function(err, rooms) {
            if (err) return res.status(500).send({message: 'Unexpected error occurred'});

            Room.unsubscribe(req.socket, rooms);
            Room.unwatch(req.socket);
        });
    },

    userTyping: function(req, res) {
        var roomName = req.body.roomName;
        var user = req.body.user;
        var socket = req.socket;

        sails.sockets.broadcast(roomName, 'user-typing', user, socket);

        res.status(200).end();
    }
};