import React from 'react';
import {connect} from 'react-redux';
import {Button, Grid, Header, Loader, Menu, Segment} from 'semantic-ui-react';
import PropTypes from 'prop-types';
import {get} from '../../ducks/sources';
import {Link} from 'react-router-dom';

class SourcesList extends React.Component {
  constructor(props) {
    super(props);
    props.get();
  }

  render() {
    const { sources, loading } = this.props;
    const sourcesList = sources.map(({_id, displayName}) => <Menu.Item as={Link} to={`/${_id}`}>{displayName}</Menu.Item>);
    let body;
    if(loading) {
      body = <Loader inline="centered" active/>
    } else if(sourcesList.length) {
      body = <Menu vertical inverted fluid items={sourcesList}/>;
    } else {
      body = <Button icon="refresh" color="orange" content="Refresh"/>
    }

    return (
        <Grid
          padded
          textAlign='center'
        >
          <Grid.Column style={{ maxWidth: 450 }}>
            <Header as='h2' icon="video" color='orange' textAlign='center' content="WEBM Thread"/>
            <Segment>
              {body}
            </Segment>
          </Grid.Column>
        </Grid>
    );
  }
}

SourcesList.propTypes = {
  sources: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired
  })).isRequired,
  loading: PropTypes.bool.isRequired,
};

const mapStateToProps = ({ sources }) => (sources);
const mapDispatchToProps = {get};

export default connect(mapStateToProps, mapDispatchToProps)(SourcesList);
