import React from 'react';
import {Menu, Loader, Button, Grid, Header, Segment, Card} from 'semantic-ui-react';
import PropTypes from 'prop-types';
import {Link} from 'react-router-dom';
import {get} from '../../ducks/thread';
import {connect} from "react-redux";

class Thread extends React.Component {
  constructor(props) {
    super(props);
    props.get(props.sourceId, props.threadId);
  }

  render() {
    const {thread: {subject, videos}, loading, sourceId} = this.props;
    let body;
    if(loading) {
      body = <Loader inline="centered" active/>
    } else if(videos && videos.length) {
      const cards = videos.map(v=>({image: v.thumbnailUrl, header: v.displayName}))
      body = <Card.Group centered items={cards}/>
    } else {
      body = <Button icon="refresh" color="orange" content="Refresh"/>
    }

    return (
      <Grid
        padded
        textAlign='center'
      >
        <Grid.Column>
          <Header as='h2' icon="video" color='orange' textAlign='center' content={subject}/>
            {body}
        </Grid.Column>
      </Grid>
    );
  }
}

Thread.propTypes = {
  thread: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool.isRequired,
  sourceId: PropTypes.string.isRequired
};

const mapStateToProps = ({ thread }) => (thread);
const mapDispatchToProps = {get};

export default connect(mapStateToProps, mapDispatchToProps)(Thread);
