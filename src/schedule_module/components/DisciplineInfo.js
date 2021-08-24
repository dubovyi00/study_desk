import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Linking,
  Platform
} from 'react-native';

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
    boxShadow,
    DEFAULT_TEACHER_PORTRAIT,
    theme,
} from '../../constants'

import ThemedCard from "../../components/ThemedCard";

const DisciplineInfo = props => {
  const { textStyle, viewStyle, titleStyle, underline} = styles;
  const { NAME, SURNAME, PATRONYMIC, CABINET, MAIN_SUBDIVISION, EMAIL, SITE_LINK, PORTRAIT_URL } = props.teacher;
  
  if(Platform.OS==="web")
      return (
        NAME?
          // <View style = {[viewStyle,styles.mainBox]}>
          <ThemedCard>
            <View style={styles.mainBox}>
              <Image
                style={styles.img}
                source={PORTRAIT_URL ? PORTRAIT_URL : DEFAULT_TEACHER_PORTRAIT} />
              <View style={styles.profile_fields_box}>
                <Text style={[titleStyle, underline]} onPress={() => Linking.openURL(SITE_LINK)}>{SURNAME} {NAME} {PATRONYMIC}</Text>
                <Text style={textStyle}>Кафедра {MAIN_SUBDIVISION} {CABINET}</Text>
                <Text style={[textStyle, underline]} selectable={true}>{EMAIL}</Text>
              </View>
            </View>
          </ThemedCard>
        : null
      )
  else
      return (
        NAME?
        //<View style = {viewStyle}>
        <ThemedCard>
          <Text style={[titleStyle,underline]} onPress={() => Linking.openURL(SITE_LINK)}>{SURNAME} {NAME} {PATRONYMIC}</Text>
          <Text style={textStyle}>Кафедра {MAIN_SUBDIVISION} {CABINET}</Text>
          <Text style={[textStyle,underline]} selectable ={true}>{EMAIL}</Text>
         </ThemedCard>
        // </View>
        : null
      )
}


const styles = StyleSheet.create({
    textStyle :
    {
      fontSize: componentFontSize,
      color: theme.colors.text2,
      flexShrink:1,
    },
    profile_fields_box: {
      flexDirection: 'column',
      flexShrink:1,
      justifyContent: "center",
      alignItems: "center",
      maxWidth:700,
    },
    img: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginRight: 12,
      alignItems: "center"
    },
    titleStyle :
    {
      fontSize: componentTitleSize,
      color: theme.colors.text,
      flexShrink:1,
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
    underline:{
      textDecorationLine: 'underline'
    },    
    mainBox:{
      flexDirection: "row",
    },
    infoBox:{
      flexDirection: "column",
    },
  });
  
  export { DisciplineInfo }