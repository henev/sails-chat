'use strict';

describe('Service: socketEvents', function () {

  // load the service's module
  beforeEach(module('sailsChatApp'));

  // instantiate service
  var socketEvents;
  beforeEach(inject(function (_socketEvents_) {
    socketEvents = _socketEvents_;
  }));

  it('should do something', function () {
    expect(!!socketEvents).toBe(true);
  });

});
