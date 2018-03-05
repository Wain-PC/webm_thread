import { request } from '../utils/request';

// Actions
const GET_THREADS_START = 'clientui/user/GET_THREADS_START';
const GET_THREADS_SUCCESS = 'clientui/user/GET_THREADS_SUCCESS';
const GET_THREADS_ERROR = 'clientui/user/GET_THREADS_ERROR';

const initialState = {
  loading: false,
  threads: [],
};

// Reducer
export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case GET_THREADS_START: {
      return {
        ...initialState,
        loading: true,
      };
    }
    case GET_THREADS_SUCCESS: {
      return {
        ...state,
        loading: false,
        threads: action.payload,
      };
    }
    case GET_THREADS_ERROR: {
      return { ...initialState };
    }
    default:
      return state;
  }
}

/* Normal (sync) action creators */
const getThreadsStart = () => ({ type: GET_THREADS_START });
const getThreadsSuccess = threads => ({ type: GET_THREADS_SUCCESS, payload: threads });
const getThreadsError = () => ({ type: GET_THREADS_ERROR });

/* Thunks action creators */
const get = sourceId => (dispatch) => {
  dispatch(getThreadsStart());
  return request('/threads', {sourceId})
    .then(
      (threads) => {
        dispatch(getThreadsSuccess(threads));
      },
      () => {
        dispatch(getThreadsError());
      },
    );
};

const actionCreators = { getThreadsSuccess, getThreadsError };

export { get, actionCreators };
