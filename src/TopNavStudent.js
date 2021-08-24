import React from "react";
import { View, Button, StyleSheet, Text, Dimensions } from "react-native";
import { withRouter } from "react-router-dom";

import AuthActivity from "./authorization_module/AuthActivity"
import ChatActivity from "./chat_module/ChatActivity"
import ConverterActivity from "./converter_module/ConverterActivity"
import ScheduleActivity from './schedule_module/ScheduleActivity';
import StudentActivity from './student_module/StudentActivity';
import TeacherActivity from './teacher_module/TeacherActivity';
import TaskActivity from './task_module/TaskActivity';
import SplashActivity from "./SplashActivity"
import { backgroundColor, headerFontSize, marginComponent, paddingComponent, textColor } from "./constants";
import { TouchableOpacity } from "react-native";

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from './constants';

var oldLoc = 0

const TopNavStudent = ({ history }) => {
  if(history.location.pathname.length < 2)
    history.push("/app/")

  var locations = [
    {name: "Главная", href: "/app/", icon: 'account-circle-outline'},
    {name: "Расписание", href: "/app/schedule", icon: 'timetable'},
    {name: "Чат", href: "/app/rooms", icon: 'chat-outline'},
    {name: "Конвертер", href: "/app/converter", icon: 'file-compare'},
  ]

  var bigScreen = Dimensions.get('window').width > 600;
  
  let navButtons =
    locations.map((prop, key) => {
      var isActive = history.location.pathname==prop.href || (window.location.pathname.startsWith("/app/chat/") && prop.href == "/app/rooms")
      var color = isActive? theme.colors.accent: theme.colors.text2
      return (
      <TouchableOpacity style={styles.button} key={key} onPress={() => history.push(prop.href)}>
        <MaterialCommunityIcons name={prop.icon} size={24} color={color} style={styles.icon} />
        {bigScreen?<Text color={color} style={[styles.text, {color:color}]}>{prop.name}</Text>:<View/>}
      </TouchableOpacity>
      );
    })
    
  return (
    <View style={styles.main}>{navButtons}</View>
  );
};

const styles = StyleSheet.create({
  main: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    backgroundColor: theme.colors.card,
  },
  button: {
    overflow: "hidden",
    flex: 1,
    paddingBottom: paddingComponent,
    backgroundColor: theme.colors.card,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  text: {
    textColor: textColor,
    fontSize: headerFontSize-4,
  },
  icon: {
    marginTop: 12,
    margin: 8,
  },
});

export default withRouter(TopNavStudent);
