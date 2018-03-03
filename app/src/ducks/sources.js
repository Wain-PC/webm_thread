import { request } from '../utils/request';

// Actions
const GET_SOURCES_START = 'clientui/user/GET_SOURCES_START';
const GET_SOURCES_SUCCESS = 'clientui/user/GET_SOURCES_SUCCESS';
const GET_SOURCES_ERROR = 'clientui/user/GET_SOURCES_ERROR';

const initialState = {
  loading: false,
  sources: [],
};

// Reducer
export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case GET_SOURCES_START: {
      return {
        ...initialState,
        loading: true,
      };
    }
    case GET_SOURCES_SUCCESS: {
      return {
        ...state,
        loading: false,
        sources: action.payload,
      };
    }
    case GET_SOURCES_ERROR: {
      return { ...initialState };
    }
    default:
      return state;
  }
}

/* Normal (sync) action creators */
const getSourcesStart = () => ({ type: GET_SOURCES_START });
const getSourcesSuccess = sources => ({ type: GET_SOURCES_SUCCESS, payload: sources });
const getSourcesError = () => ({ type: GET_SOURCES_ERROR });

/* Thunks action creators */
const get = () => (dispatch) => {
  dispatch(getSourcesStart());
  return request('/sources')
    .then(
      (sources) => {
        dispatch(getSourcesSuccess(sources));
      },
      () => {
        dispatch(getSourcesError());
      },
    );
};

const actionCreators = { getSourcesSuccess, getSourcesError };

export { get, actionCreators };
