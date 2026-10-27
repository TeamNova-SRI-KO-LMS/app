const http = require('http');

describe('server.js entry point', () => {
  test('TC-UNIT-SRV-01 exports the Express app without opening a port when imported [NFR-006]', () => {
    const listen = jest.spyOn(http.Server.prototype, 'listen');

    const server = require('../../../server');
    const app = require('../../../app');

    expect(server).toBe(app);
    expect(listen).not.toHaveBeenCalled();
  });
});
