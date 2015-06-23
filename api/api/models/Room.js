/**
 * Room.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    attributes: {
        name: {
            type: 'string',
            unique: true
        },
        owner: {
            model: 'user'
        },
        users: {
            collection: 'user',
            via: 'rooms'
        },
        messages: {
            collection: 'message'
        }
    },

    afterDestroy: function(destroyedRecords, cb) {
        var ids = _.pluck(destroyedRecords, 'id');

        if (ids && ids.length) {
            // remove the subscribers from the room and broadcast a msg to them
            destroyedRecords.forEach(function(record) {
                User.findOne({id: record.owner})
                    .exec(function(err, user) {
                        if (err) cb();

                        // First we remove the owner of the room so that he won't receive broadcast msgs
                        sails.sockets.leave(user.socket, record.name);

                        sails.sockets.broadcast(record.name, 'toast', 'The room was deleted by its owner');
                        sails.sockets.broadcast(record.name, 'destroy-room', null);

                        var subscribers = sails.sockets.subscribers(record.name);
                        subscribers.forEach(function(subscriber) {
                            sails.sockets.leave(subscriber, record.name)
                        });
                    });
            });

            // Remove the messages that were in that room
            Message
                .destroy({room: ids})
                .exec(cb);
        } else {
            cb();
        }
    }

};

