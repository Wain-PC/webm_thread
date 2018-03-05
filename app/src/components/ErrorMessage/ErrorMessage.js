import React from 'react';
import PropTypes from 'prop-types';
import { Message } from 'semantic-ui-react';

const camelToError = string => string
  .replace(/([A-Z])/g, $1 => ` ${$1.toLowerCase()}`)
  .split(' ')
  .map(word => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(' ');

const ErrorMessage = ({ text, ...props }) =>
  (
    <Message
      {...props}
      icon="warning sign"
      error
      hidden={!text.length}
      content={camelToError(text)}
    />
  );

ErrorMessage.propTypes = {
  text: PropTypes.string,
};

ErrorMessage.defaultProps = {
  text: '',
};

export default ErrorMessage;
