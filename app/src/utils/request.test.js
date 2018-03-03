import { request } from './request';

describe('request', () => {
  afterEach(() => global.mockHTTP.reset());

  it(
    'works without options',
    () => {
      const data = { version: 1 };
      global.mockHTTP
        .onPost('/')
        .reply(200, data);

      return request()
        .then(inputData => expect(inputData).toEqual(data));
    },
  );


  it(
    'makes calls to /api and returns valid data',
    () => {
      global.mockHTTP
        .onPost('endpoint')
        .reply(200, { data: [1, 2, 3, 4, 5] });

      return request('endpoint')
        .then(data => expect(data).toEqual({ data: [1, 2, 3, 4, 5] }));
    },
  );

  it(
    'passes options correctly',
    () => {
      const options = {
        value: 1,
        date: '11.11.11',
        time: -1,
      };
      global.mockHTTP
        .onPost('endpoint')
        .reply(config => [200, config.data]);

      return request('endpoint', options)
        .then(data => expect(data).toEqual(options));
    },
  );

  it(
    'makes calls to /api and throws errors correctly',
    () => {
      const message = 'noIncidentsFound';
      const fnResolve = jest.fn();
      const fnReject = jest.fn();

      global.mockHTTP
        .onPost('endpoint')
        .reply(404, { message });

      return request('endpoint')
        .then(fnResolve, fnReject)
        .then(() => {
          expect(fnResolve).not.toBeCalled();
          expect(fnReject).toBeCalledWith(message);
        });
    },
  );

  it(
    'throws error `500` when response doesn`t contain a valid error',
    () => {
      const fnResolve = jest.fn();
      const fnReject = jest.fn();

      global.mockHTTP
        .onPost('endpoint')
        .networkError();

      return request('endpoint')
        .then(fnResolve, fnReject)
        .then(() => {
          expect(fnResolve).not.toBeCalled();
          expect(fnReject).toBeCalledWith('500');
        });
    },
  );

  it(
    'passes current time zone correctly',
    () => {
      const currentTimeZone = new Date().getTimezoneOffset() / 60;
      global.mockHTTP
        .onPost('endpoint')
        .reply(config => [200, config.headers['client-tz-offset']]);

      return request('endpoint')
        .then(data => expect(data).toEqual(currentTimeZone));
    },
  );
});
