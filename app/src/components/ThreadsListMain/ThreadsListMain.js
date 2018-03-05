import React from 'react';
import {Menu, Loader, Button, Grid, Header, Segment} from 'semantic-ui-react';
import PropTypes from 'prop-types';
import {Link} from 'react-router-dom';
import {get} from '../../ducks/threads';
import {connect} from "react-redux";

class ThreadsListMain extends React.Component {
  constructor(props) {
    super(props);
    props.get(props.sourceId);
  }

  render() {
    const {threads, loading, sourceId} = this.props;

    const threadsList = threads.map((t) => <Menu.Item key={t.id} as={Link} to={`/${sourceId}/${t.id}`}>{t.subject}</Menu.Item>);
    let body;
    if(loading) {
      body = <Loader inline="centered" active/>
    } else if(threadsList.length) {
      body = <Menu vertical inverted fluid items={threadsList}/>;
    } else {
      body = <Button icon="refresh" color="orange" content="Refresh"/>
    }

    return (
      <Grid
        padded
        textAlign='center'
      >
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as='h2' icon="video" color='orange' textAlign='center' content={sourceId}/>
          <Segment>
            {body}
          </Segment>
        </Grid.Column>
      </Grid>
    );
  }
}

ThreadsListMain.propTypes = {
  threads: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool.isRequired,
  sourceId: PropTypes.string.isRequired
};

const mapStateToProps = ({ threads }) => (threads);
const mapDispatchToProps = {get};

export default connect(mapStateToProps, mapDispatchToProps)(ThreadsListMain);
