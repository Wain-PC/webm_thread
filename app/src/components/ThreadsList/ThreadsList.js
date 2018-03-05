import React from 'react';
import { Menu } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {get} from '../../ducks/threads';
import {connect} from "react-redux";

class ThreadsList extends React.Component {
  constructor(props) {
    super(props);
    props.get(props.sourceUrl);
  }

  componentWillReceiveProps(newProps) {
    if(newProps.active !== this.props.active || newProps.sourceUrl !== this.props.sourceUrl) {
      newProps.get(newProps.sourceUrl);
    }
  }

  render() {
    const {threads, loading, active, sourceUrl} = this.props;
    const items = threads.map(({url}) => (
      <Menu.Item
        color="teal"
        key={url}
        active={url === active}
      >
        {url}
      </Menu.Item>
    ));

    return (
      <Menu
        fixed="left"
        inverted
        vertical
        style={{ overflowX: 'hidden', overflowY: 'auto' }}
      >
        {items}
      </Menu>
    );
  }
}

ThreadsList.propTypes = {
  threads: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool.isRequired,
  active: PropTypes.string.isRequired,
  sourceUrl: PropTypes.string.isRequired
};

const mapStateToProps = ({ threads }) => (threads);
const mapDispatchToProps = {get};

export default connect(mapStateToProps, mapDispatchToProps)(ThreadsList);
