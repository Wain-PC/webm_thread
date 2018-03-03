import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import LoginForm from '../components/LoginForm/LoginForm';
import RedirectToDefaultPage from '../components/RedirectToDefaultPage/RedirectToDefaultPage';
import { cancel as onCancel, sendLogin, sendSecondFactor } from '../ducks/login';

class LoginView extends React.Component {
  static get propTypes() {
    return {
      login: PropTypes.shape({
        loading: PropTypes.bool.isRequired,
        error: PropTypes.string.isRequired,
        secondFactor: PropTypes.bool.isRequired,
      }).isRequired,
      user: PropTypes.shape({
        loggedIn: PropTypes.bool.isRequired,
      }).isRequired,
      sendSecondFactor: PropTypes.func.isRequired,
      sendLogin: PropTypes.func.isRequired,
      onCancel: PropTypes.func.isRequired,
    };
  }

  render() {
    const {
      // eslint-disable-next-line
      sendLogin, onCancel, sendSecondFactor, login: { loading, error, secondFactor }, user: { loggedIn },
    } = this.props;
    return loggedIn ? <RedirectToDefaultPage/> :
      (
        <LoginForm
          onCancel={onCancel}
          secondFactor={secondFactor}
          onSecondFactorSubmit={sendSecondFactor}
          onSubmit={sendLogin}
          loading={loading}
          error={error}
        />
      );
  }
}

const mapStateToProps = state => ({
  login: state.login,
  user: state.user,
});

const mapDispatchToProps = {
  sendLogin,
  onCancel,
  sendSecondFactor,
};


export default connect(mapStateToProps, mapDispatchToProps)(LoginView);
