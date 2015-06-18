/**
 * MessageController
 *
 * @description :: Server-side logic for managing messages
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	create: function(req, res) {
        var socket = req.socket;
        var text = req.body.text;
        var roomId = req.body.roomId;

        // Find user by socket id (we need the user id for the message)
        User.findOne({socket: socket.id})
            .exec(function(err, foundUser) {
                if (err) return res.status(500).send({message: 'Error creating message'});

                if (foundUser) {
                    // Create new message
                    Message.create({
                        text: text,
                        room: roomId,
                        owner: foundUser.id
                    }).exec(function(err, msg) {
                        if (err) return res.status(500).send({message: 'Error creating message'});

                        // Find the room of the message to add the message to the rooms collection
                        Room.findOne({id: roomId})
                            .populate('messages')
                            .exec(function(err, room) {
                                if (err) return res.status(500).send({message: 'Error creating message'});

                                // Add the new message to the rooms collection of messages
                                room.messages.add(msg.id);
                                room.save(function(err, savedRoom) {
                                    if (err) return res.status(500).send({message: 'Error creating message'});

                                    // Publish to the sockets that a new message has been created
                                    Message.publishCreate({
                                        id: msg.id
                                    });

                                    res.status(200).end();
                                });
                            });
                    });
                } else {

                    return res.status(500).send({message: 'Error creating message'});
                }
            });
    }
};

