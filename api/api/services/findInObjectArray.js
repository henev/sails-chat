module.exports = function(array, property, value) {
    var itemFound = false;

    array.forEach(function(item) {
        if (item.hasOwnProperty(property) && item[property] === value) {
            itemFound = item[property];

            return false;
        }
    });

    return itemFound;
};