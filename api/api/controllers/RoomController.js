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

        User.findOne({ id: userId }, function(err, foundUser) {
            if (err) return res.status(401).send({message: 'Authorization failed'});

            if (foundUser) {
                foundUser.socket = socket.id;
                foundUser.save(function(err, user) {
                    sails.sockets.join(socket, roomName);
                    sails.sockets.broadcast(roomName, 'toast', user, socket);
                    sails.sockets.broadcast(roomName, 'refresh', null);

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

        var sockets = sails.sockets.subscribers(roomName);
        var index = sockets.indexOf(socket.id.toString());
        if (index > -1) {
            sockets.splice(index, 1);
        }

        User.find({socket: sockets}, function(err, users) {
            if (err) return res.status(500).end();

            res.status(200).json(users);
        });
    }
};

