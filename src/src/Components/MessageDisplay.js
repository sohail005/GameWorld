import React from 'react';
import { styles } from '../Styles/styles';

const MessageDisplay = ({ message }) => (
  <div style={styles.messageDisplay}>
    {message}
  </div>
);

export default MessageDisplay;