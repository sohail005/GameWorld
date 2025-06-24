import React from 'react';
import { styles } from '../Styles/styles';

const Hud = ({ speed, lap, totalLaps }) => (
  <div style={styles.hud}>
    <div style={styles.hudItem}>
      <span style={styles.speedometer}>{speed} KM/H</span>
    </div>
    <div style={styles.hudItem}>
      <span style={styles.lapCounter}>Lap: {lap} / {totalLaps}</span>
    </div>
  </div>
);

export default Hud;