import React from "react";
import { View, Text, StyleSheet } from "react-native";

import {
  backgroundColor
} from '../constants'

class TaskActivity extends React.Component {
  render() {
    const { navigation } = this.props;
    
    
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>создание заданий для препода</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: backgroundColor
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  }
});

export default TaskActivity;