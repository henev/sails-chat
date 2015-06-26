'use strict';

describe('Service: MessageService', function () {

  // load the service's module
  beforeEach(module('sailsChatApp'));

  // instantiate service
  var MessageService;
  beforeEach(inject(function (_MessageService_) {
    MessageService = _MessageService_;
  }));

  it('should do something', function () {
    expect(!!MessageService).toBe(true);
  });

});
