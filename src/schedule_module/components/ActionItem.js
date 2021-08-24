import React from 'react';
import {
TouchableHighlight,
  View,
  Text,
  StyleSheet,
  Platform
} from 'react-native';
import ThemedCard from "../../components/ThemedCard";

import{marginComponent,
   paddingComponent,
    mainColor,
    borderRadius,
    borderWidth,
    borderColor,
    componentFontSize,
    componentTitleSize,
    textExtraColor,
    textColor,
    elevation,
    backgroundColor,
    boxShadow,
    theme
} from '../../constants'


const ActionItem = props=>{
    const {reViewStyle, text} = props;
    const {viewStyle, titleStyle} = styles;
    return(
    <TouchableHighlight onPress={() => {props.onPress() } } underlayColor={backgroundColor}>
      <ThemedCard>
      {/* <View style={[viewStyle, reViewStyle]}> */}
      <Text style={titleStyle} >{text}</Text>
    {/* </View> */}
    </ThemedCard>
  </TouchableHighlight>)
}

const styles = StyleSheet.create({
    titleStyle :
    {
      fontSize: componentTitleSize,
      color: theme.colors.text,
      textAlign: 'center'
    },
    viewStyle:{
      borderRadius: borderRadius,
      margin: marginComponent,
      padding: paddingComponent,
      backgroundColor: theme.colors.card,
      ...Platform.select({
        android: {
            elevation: elevation
        },
        default: {
          boxShadow: boxShadow
        }
      })
    },
  });
  
  export { ActionItem }