import { load, save } from './storage';

describe('save', () => {
  it('should return true if the data has been saved sucessfully', () => {
    const testData = { test: 'test', id: 0 };
    expect(save('test', testData)).toEqual(true);
  });


  it('should save nothing if key was not provided', () => {
    expect(save()).toEqual(false);
  });

  it('should save nothing if value was not provided', () => {
    expect(save('test')).toEqual(false);
  });

  it('should return false if the data has not been saved (localStorage)', () => {
    const testData = { test: 'test', id: 0 };
    const stub = jest.fn(() => {
      throw new Error('Storage throwed an error');
    });
    const storageBackup = window.localStorage;
    window.localStorage = {
      getItem: stub,
      setItem: stub,
    };
    expect(save('test', testData)).toEqual(false);
    window.localStorage = storageBackup;
  });

  it('should return false if the data has not been saved (sessionStorage)', () => {
    const testData = { test: 'test', id: 0 };
    const stub = jest.fn(() => {
      throw new Error('Storage throwed an error');
    });
    const storageBackup = window.sessionStorage;
    window.sessionStorage = {
      getItem: stub,
      setItem: stub,
    };
    expect(save('test', testData, true)).toEqual(false);
    window.sessionStorage = storageBackup;
  });

  it('should not fail if no storages available at all', () => {
    const lsBackup = window.localStorage;
    const ssBackup = window.sessionStorage;
    window.localStorage = undefined;
    window.sessionStorage = undefined;

    expect(save('test', {})).toEqual(true);
    expect(save('test', {}, true)).toEqual(true);

    window.localStorage = lsBackup;
    window.sessionStorage = ssBackup;
  });
});

describe('load', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should accept exactly 2 arguments', () => {
    expect(load.length).toBe(1);
  });

  it('returns empty object when called with no params (and no storage)', () => {
    expect(load()).toEqual({});
  });

  it('returns complete object when called with no params (and no storage)', () => {
    save('one', 1);
    save('two', 2);
    expect(load()).toEqual({ one: 1, two: 2 });
  });

  it(
    'returns empty object when accessing non-existing property',
    () => {
      expect(load('smth')).toEqual({});
      expect(load('smth', true)).toEqual({});
    },
  );

  it('should load previously set data correctly (localStorage)', () => {
    const testData = { test: 'test', id: 0 };
    save('test', testData);
    const result = load('test');
    expect(result).toEqual(testData);
  });

  it('should load previously set data correctly (sessionStorage)', () => {
    const testData = { test: 'test', id: 0 };
    save('test', testData, true);
    const result = load('test', true);
    expect(result).toEqual(testData);
  });

  it('should load previously set data correctly (string data)', () => {
    const testData = 'it`s just a string';
    save('test', testData);
    const result = load('test');
    expect(result).toEqual(testData);
  });

  it('should load previously set data correctly (numeric data)', () => {
    const testData = -123.456789;
    save('test', testData);
    const result = load('test');
    expect(result).toEqual(testData);
  });

  it('should not fail if no storages available at all', () => {
    const lsBackup = window.localStorage;
    const ssBackup = window.sessionStorage;
    window.localStorage = undefined;
    window.sessionStorage = undefined;

    expect(load()).toEqual({});

    window.localStorage = lsBackup;
    window.sessionStorage = ssBackup;
  });
});
