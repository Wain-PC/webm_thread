import { request } from '../utils/request';

// Actions
const GET_THREAD_START = 'clientui/user/GET_THREAD_START';
const GET_THREAD_SUCCESS = 'clientui/user/GET_THREAD_SUCCESS';
const GET_THREAD_ERROR = 'clientui/user/GET_THREAD_ERROR';

const initialState = {
  loading: false,
  thread: [],
};

// Reducer
export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case GET_THREAD_START: {
      return {
        ...initialState,
        loading: true,
      };
    }
    case GET_THREAD_SUCCESS: {
      return {
        ...state,
        loading: false,
        thread: action.payload,
      };
    }
    case GET_THREAD_ERROR: {
      return { ...initialState };
    }
    default:
      return state;
  }
}

/* Normal (sync) action creators */
const getThreadStart = () => ({ type: GET_THREAD_START });
const getThreadSuccess = thread => ({ type: GET_THREAD_SUCCESS, payload: thread });
const getThreadError = () => ({ type: GET_THREAD_ERROR });

/* Thunks action creators */
const get = url => (dispatch) => {
  dispatch(getThreadStart());
  return request('/thread', {url})
    .then(
      (thread) => {
        dispatch(getThreadSuccess(thread));
      },
      () => {
        dispatch(getThreadError());
      },
    );
};

const actionCreators = { getThreadSuccess, getThreadError };

export { get, actionCreators };
