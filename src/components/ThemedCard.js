import React from 'react';
import { Card } from "react-native-paper";
import {theme} from "../constants";

export default class ThemedCard extends React.Component {
    render() {
      return (
        <Card {...this.props} style={[{margin: 15, padding: 15, marginBottom: 0, backgroundColor:theme.colors.card}, this.props.style]}>
          {this.props.children}
        </Card>
      )
    }
  }