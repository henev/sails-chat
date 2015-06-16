/**
 * RoomController
 *
 * @description :: Server-side logic for managing rooms
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var jwt = require('jwt-simple');

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
                    // Save the socket to the user in db
                    foundUser.socket = socket.id;
                    foundUser.save(function(err, user) {
                        // Joins/Subscribes user to the room
                        sails.sockets.join(socket, roomName);
                        // Broadcast a msg to other users in that room notifying for the new user
                        sails.sockets.broadcast(roomName, 'toast', user.name + ' has entered the ' + roomName + ' room', socket);
                        // Refreshes every subscriber's user view
                        sails.sockets.broadcast(roomName, 'refresh', null);

                        // Create / find room and add the user to it if he is not already in
                        Room.findOne({name: roomName}, function(err, foundRoom) {
                            if (!foundRoom) {
                                // Create room and add user
                                Room.create({
                                    name: roomName
                                }).exec(function(err, room) {
                                    room.users.add(user.id);
                                    room.save();
                                });
                            } else {
                                // Check if user is already in (subscribed to) room
                                var userIsInRoom = false;
                                foundUser.rooms.forEach(function(room) {
                                    if (room.id === foundRoom.id) {
                                        userIsInRoom = true;
                                    }
                                });
                                // Adds (subscribes) him if he is not in the room
                                if (!userIsInRoom) {
                                    foundRoom.users.add(user.id);
                                    foundRoom.save();
                                }
                            }
                        });

                        res.status(200).json(user);
                    });
                } else {
                    res.status(401).send({message: 'Authorization failed'});
                }
            });
    },

    leave: function(req, res) {
        req.socket.userName = req.body.name;

        sails.sockets.leave(req.socket, 'global');
        sails.sockets.broadcast('global', 'user_left_global', req.socket.userName);

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

