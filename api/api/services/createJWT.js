var jwt = require('jwt-simple');
var moment = require('moment');

module.exports = function(user) {
    var payload = {
        sub: user.id,
        iat: moment().unix(),
        exp: moment().add(14, 'days').unix()
    };

    return jwt.encode(payload, config.TOKEN_SECRET);
};