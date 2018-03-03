const storageName = 'WEBMTHREAD_SETTINGS';

const getStorage = (useSessionStorage) => {
  const storage = useSessionStorage ? window.sessionStorage : window.localStorage;
  return storage || {
    getItem: () => undefined,
    setItem: () => {
    },
  };
};

const load = (stateName, useSessionStorage = false) => {
  let store;
  if (typeof useSessionStorage === 'object') {
    store = useSessionStorage;
  } else {
    store = getStorage(useSessionStorage);
  }
  try {
    const res = JSON.parse(store.getItem(storageName)) || {};
    return stateName ? res[stateName] || {} : res;
  } catch (e) {
    return {};
  }
};

const save = (key, value, useSessionStorage = false) => {
  if (!key || typeof key !== 'string' || value === undefined) {
    return false;
  }
  const store = getStorage(useSessionStorage);
  try {
    const data = load(null, store);
    data[key] = value;
    store.setItem(storageName, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
};

export { save, load };
