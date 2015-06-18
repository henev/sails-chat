/**
 * RoomController
 *
 * @description :: Server-side logic for managing rooms
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var jwt = require('jwt-simple');
var q = require('q');

module.exports = {
    join: function(req, res) {
        var token = req.body.token;
        var roomName = req.body.roomName;
        var socket = req.socket;
        var payload = jwt.decode(token, config.TOKEN_SECRET);
        var userId = payload.sub;

        User.findOne({id: userId})
            .populate('rooms')
            .exec(function(err, foundUser) {

                if (err) return res.status(401).send({message: 'Authorization failed'});

                if (foundUser) {
                    var deferred = q.defer();

                    // Save the socket to the user in db
                    foundUser.socket = socket.id;
                    foundUser.save(function(err, user) {

                        // Create / find room and add the user to it if he is not already in
                        Room.findOne({name: roomName}, function(err, foundRoom) {
                            if (!foundRoom) {
                                // Create room and add user
                                Room.create({
                                    name: roomName
                                }).exec(function(err, room) {
                                    room.users.add(user.id);
                                    room.save(function(err, savedRoom) {
                                        // Send a msg to all subscribers to room model to update their rooms
                                        Room.publishCreate({id: savedRoom.id, name: savedRoom.name});
                                        deferred.resolve();

                                        res.status(200).json(savedRoom);
                                    });
                                });
                            } else {
                                // Check if user is already in (subscribed to) room
                                var userIsInRoom = findInObjectArray(foundUser.rooms, 'id', foundRoom.id);

                                // Adds (subscribes) him if he is not in the room
                                if (!userIsInRoom) {
                                    foundRoom.users.add(user.id);
                                    foundRoom.save(function(err, savedRoom) {
                                        deferred.resolve();

                                        res.status(200).json(savedRoom);
                                    });
                                }
                            }
                        });
                    });
                } else {
                    res.status(401).send({message: 'Authorization failed'});
                }

                deferred.promise.then(function() {
                    // Joins/Subscribes user to the room
                    sails.sockets.join(socket, roomName);
                    // Broadcast a msg to other users in that room notifying for the new user
                    sails.sockets.broadcast(roomName, 'toast', foundUser.name + ' has entered the ' + roomName + ' room', socket);
                    // Refreshes every subscriber's user view
                    sails.sockets.broadcast(roomName, 'refresh', roomName);
                });
            });
    },

    leave: function(req, res) {
        var roomName = req.body.roomName;
        var socket = req.socket;

        sails.sockets.leave(socket, roomName);
        sails.sockets.broadcast(roomName, 'refresh', roomName);

        Room.findOne({name: roomName})
            .populate('users', {socket: socket.id})
            .exec(function(err, room) {
                if (err) return res.status(500).send({message: 'Problem with socket leaving the room'});

                if (room) {
                    room.users.forEach(function(user) {
                        if (user.socket === socket.id) {
                            room.users.remove(user.id);
                            room.save();

                            sails.sockets.broadcast(roomName, 'toast', user.name + ' has left the ' + roomName + ' room');
                        }
                    });

                } else {
                    return res.status(404).send({message: 'The room has not been found'});
                }
            });

        res.status(200).end();
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
            if (err) return res.status(500).end();

            res.status(200).json(users);
        });
    }
};