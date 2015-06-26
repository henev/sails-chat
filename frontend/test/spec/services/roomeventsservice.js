'use strict';

describe('Service: RoomEventsService', function () {

  // load the service's module
  beforeEach(module('sailsChatApp'));

  // instantiate service
  var RoomEventsService;
  beforeEach(inject(function (_RoomEventsService_) {
    RoomEventsService = _RoomEventsService_;
  }));

  it('should do something', function () {
    expect(!!RoomEventsService).toBe(true);
  });

});
