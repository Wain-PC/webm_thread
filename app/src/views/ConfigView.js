import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Form, Grid, Loader, Menu } from 'semantic-ui-react';
import { save as saveToStorage } from '../utils/storage';
import { get, save } from '../ducks/config';
import ConfigsList from '../components/ConfigsList/ConfigsList';
import ErrorMessage from '../components/ErrorMessage/ErrorMessage';

class ConfigView extends React.Component {
  static get propTypes() {
    return {
      config: PropTypes.shape({
        config: PropTypes.string.isRequired,
        loading: PropTypes.bool.isRequired,
        error: PropTypes.string.isRequired,
      }).isRequired,
      userName: PropTypes.string.isRequired,
      match: PropTypes.shape({
        params: PropTypes.shape({
          id: PropTypes.string.isRequired,
          domain: PropTypes.string.isRequired,
        }).isRequired,
      }).isRequired,
      get: PropTypes.func.isRequired
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      value: '',
    };
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  componentDidMount() {
    const { get, match: { params: { id, domain } } } = this.props; // eslint-disable-line no-shadow
    get(id, domain).catch(() => {});
  }

  componentWillReceiveProps(newProps) {
    // eslint-disable-next-line no-shadow
    const { get, config: { config }, match: { params: { id, domain } } } = newProps;
    if (this.props.match.params.id !== id || this.props.match.params.domain !== domain) {
      get(id, domain).catch(() => {});
    }
    if (config !== this.props.config.config) {
      this.setState({ value: config });
    }
  }

  onChange({ target: { value } }) {
    this.setState({ value });
  }

  onSubmit() {
    // eslint-disable-next-line no-shadow
    const { save, get, match: { params: { id, domain } } } = this.props;
    const { value } = this.state;
    save(id, domain, value)
      .then(() => get(id, domain))
      .catch(() => {});
  }

  onCancel() {
    // eslint-disable-next-line no-shadow
    const { config: { config } } = this.props;
    this.setState({ value: config });
  }

  render() {
    const {
      config: {
        loading, error, config,
      }, match: { params: { id, domain } },
      userName,
    } = this.props;
    const { value } = this.state;
    const changesWereMade = value !== config;
    saveToStorage('latest', { id, domain });
    return (
      <div style={{ marginLeft: '15rem' }}>
        <Menu inverted fixed="top">
          <Menu.Item style={{ width: '15rem' }}/>
          <Menu.Item style={{ paddingTop: 0, paddingBottom: 0 }}>
            <Loader active={loading} inline="centered"/>
          </Menu.Item>
          <Menu.Item as="h4" header content={userName} position="right"/>
        </Menu>
        <ConfigsList clientId={id} active={domain}/>
        <Grid padded="horizontally" style={{ paddingTop: '4em' }} verticalAlign="middle">
          <Grid.Column width={16}>
            <ErrorMessage text={error}/>
            {/*List of videos*/}
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  config: state.config,
  userName: state.user.user.operatorName,
});

const mapDispatchToProps = { get };

export default connect(mapStateToProps, mapDispatchToProps)(ConfigView);
