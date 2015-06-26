'use strict';

describe('Service: RoomService', function () {

  // load the service's module
  beforeEach(module('sailsChatApp'));

  // instantiate service
  var RoomService;
  beforeEach(inject(function (_RoomService_) {
    RoomService = _RoomService_;
  }));

  it('should do something', function () {
    expect(!!RoomService).toBe(true);
  });

});
