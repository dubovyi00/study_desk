import React from "react";
import { View, Text, StyleSheet,ActivityIndicator } from "react-native";

import { theme } from './constants'

class SplashActivity extends React.Component {
  render() {
    const { style } = this.props;

    const baseStyles = [styles.container, style];

    return (
      <View style={baseStyles}>
        <ActivityIndicator size={70} color={theme.colors.accent} />
        <Text style={styles.welcome}>Загрузка...</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10,
    color: theme.colors.text2
  }
});

export default SplashActivity;