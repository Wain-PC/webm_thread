import React from 'react';
import {connect} from 'react-redux';
import {Dropdown} from 'semantic-ui-react';
import PropTypes from 'prop-types';
import {get} from '../../ducks/sources';

class SourcesList extends React.Component {
  constructor(props) {
    super(props);
    const {get} = props;
    this.state = { currentSource: '' };
    this.handleChange = this.handleChange.bind(this);
    get();
  }

  handleChange(e, { active: currentSource }) {
    this.setState({ currentSource });
  }

  render() {
    const { sources, loading, ...props } = this.props;
    const { currentSource } = this.state;
    const sourcesList = sources.map(({url}) => ({key: url, value: url, text: url}));

    return (
      <Dropdown
        fluid
        loading={loading}
        value={currentSource}
        placeholder="Select Source"
        noResultsMessage="No sources found"
        search
        selection
        options={sourcesList}
        selectOnNavigation={false}
        onChange={this.handleChange}
      />
    );
  }
}

SourcesList.propTypes = {
  sources: PropTypes.arrayOf(PropTypes.shape({
    url: PropTypes.string.isRequired,
  })).isRequired,
  loading: PropTypes.bool.isRequired,
};

const mapStateToProps = ({ sources: { sources, loading } }) => ({ sources, loading });
const mapDispatchToProps = {get};

export default connect(mapStateToProps, mapDispatchToProps)(SourcesList);
