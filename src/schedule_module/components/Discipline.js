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
    backgroundColor,
    componentFontSize,
    componentTitleSize,
    textExtraColor,
    textColor,
    elevation,
    boxShadow,
    theme
} from '../../constants'


const Discipline = props => {
  const { textStyle, viewStyle, titleStyle,positionStyle}=styles;
  if(props.isStudent)
      return (
        <TouchableHighlight onPress={() => {props.onPress(props.discipline) }} underlayColor={backgroundColor}>
          <ThemedCard>
          {/* <View style={viewStyle}> */}
            <Text style={positionStyle}>{props.discipline.POSITION}</Text>
            <Text style={titleStyle}>{props.discipline.DISCIPLINE_NAME}</Text>
            <Text style={textStyle}>{props.discipline.START_TIME} - {props.discipline.END_TIME}</Text>
            {
              props.discipline.FIO_TEACHER1?
                <Text style={textStyle}>{props.discipline.FIO_TEACHER1}{props.discipline.FIO_TEACHER2? ', '+props.discipline.FIO_TEACHER2:null}</Text>
                : null
            }
            
            {props.discipline.WEEK? <Text style={textStyle}>на неделях: {props.discipline.WEEK}</Text> : null}
            <Text style={textStyle}>{props.discipline.SYM_ROOM}</Text>
          {/* </View> */}
          </ThemedCard>
        </TouchableHighlight>);
  
  else
      return (
        <TouchableHighlight onPress={() => {props.onPress(props.discipline) }} underlayColor={backgroundColor}>
          <ThemedCard>
          {/* <View style={viewStyle}> */}
            <Text style={positionStyle}>{props.discipline.POSITION}</Text>
            <Text style={titleStyle}>{props.discipline.DISCIPLINE_NAME}</Text>
            <Text style={textStyle}>{props.discipline.START_TIME} - {props.discipline.END_TIME}</Text>
            {
              props.discipline.STUDY_GROUP?
                <Text style={textStyle}>{props.discipline.STUDY_GROUP}</Text>
                : null
            }
            
            {props.discipline.WEEK? <Text style={textStyle}>на неделях: {props.discipline.WEEK}</Text> : null}
            <Text style={textStyle}>{props.discipline.SYM_ROOM}</Text>
          {/* </View> */}
          </ThemedCard>
        </TouchableHighlight>);
  
};

const styles = StyleSheet.create({
  textStyle :
  {
    fontSize: componentFontSize,
    color: theme.colors.text2
  },
  positionStyle:
  {
    fontSize: componentTitleSize,
    fontWeight: 'bold',
    color: theme.colors.text
  },
  titleStyle :
  {
    fontSize: componentTitleSize,
    color: theme.colors.text
  },
  viewStyle:{
    backgroundColor : theme.colors.card,
    borderRadius: borderRadius,
    margin: marginComponent,
    padding: paddingComponent,
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

export { Discipline }