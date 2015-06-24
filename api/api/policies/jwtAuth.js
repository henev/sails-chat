var jwt = require('jwt-simple');

module.exports = function(req, res, next) {
    if (!req.headers.authorization) {
        console.log(req.headers);
        return handleError(res);
    }

    var token = req.headers.authorization.split(' ')[1];

    var payload = jwt.decode(token, config.TOKEN_SECRET);

    if (!payload.sub) {

        return handleError(res);
    }

    req.userId = payload.sub;

    next();
};

function handleError(res) {

    return res.status(401).send({message: 'You are not authorized'});
}