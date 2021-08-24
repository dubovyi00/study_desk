import React, { Component } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,

} from 'react-native';


import GestureRecognizer, { swipeDirections } from 'react-native-swipe-gestures';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  DayIcon,
  Discipline,
  DisciplineInfo,
  ActionItem
} from './components/index'

import {
  h, w,
  marginComponent,
  paddingComponent,
  componentTitleSize,
  textColor,
  backgroundColor,
  baseURL,
  theme,
} from '../constants'

import AsyncStorage from '@react-native-async-storage/async-storage';

import { ModalDatePicker } from "react-native-material-date-picker";

// Returns the ISO week of the date.
Date.prototype.getWeek = function () {
  var date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
    - 3 + (week1.getDay() + 6) % 7) / 7);
}

Date.prototype.getMonthName = function () {
  var date = new Date(this.getTime());
  var months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return months[date.getMonth()];
}


class ScheduleActivity extends Component {
  constructor(props) {
    super(props);

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    this.state = {
      weekNum: -1,
      //все дисциплины
      disArr: [],
      //дисциплины текущего дня
      currentdisArr: [],
      currentDay: today,
      isExtended: false,
      teachersArr: [],

      START_TIME:null,
      DAY_DATE:null,
      STUDY_GROUP:null,

      accessToken: null,
      refreshToken: null,
      isStudent: null,
      ID: null,
      NAME: null,
      SURNAME: null,
      PATRONYMIC: null,

      SYM_GROUP: null,
      SYM_FACULTET: null,
      ID_PLAN: null,
      YEAR_ADMISSION: null,
      ID_SPECIALIZATION: null,
      ID_FACULTET: null,
      ID_GROUP: null,

      FIO: null,
      DEGREE: null,
      POST: null,
      MAIN_SUBDIVISION: null,
      CABINET: null,
      EMAIL: null,
      SITE_LINK: null,
      PORTRAIT_URL: null,
    }
  }


  // выбирает из списка дисциплин те, что нужны на текущий день текущей недели
  findCurrentDisciplines(disArr, newDate, newWeekNum) {
    if (arguments.length == 1) {
      const { currentDay, weekNum } = this.state;

      const frequency = Number.isInteger(weekNum / 2) ? 1 : 2;
      let currentdisArr = disArr.filter(item => {
        if (this.state.isStudent) {
          if (currentDay.getDay() === item.DAY_NUMBER && (item.FREQUENCY >= 3 || frequency === item.FREQUENCY)) {
            return true;
          }
        } else {
          var local_date = new Date(item.DAY_DATE)
          item.FREQUENCY = 1
          item.DAY_NUMBER = local_date.getDay()
          if (currentDay.toDateString() == local_date.toDateString()) {
            return true;
          }
        }
      });
      if (weekNum < 0 || weekNum > 18) return [];
      else return currentdisArr.sort((a, b) => { return a.POSITION - b.POSITION });
    } else {
      const frequency = Number.isInteger(newWeekNum / 2) ? 1 : 2;
      let currentdisArr = disArr.filter(item => {
        if (this.state.isStudent) {
          if (newDate.getDay() === item.DAY_NUMBER && (item.FREQUENCY >= 3 || frequency === item.FREQUENCY)) {
            return true;
          }
        } else {
          var local_date = new Date(item.DAY_DATE)
          item.FREQUENCY = 1
          item.DAY_NUMBER = local_date.getDay()
          if (newDate.toDateString() == local_date.toDateString()) {
            return true;
          }
        }

      });
      if (newWeekNum < 0 || newWeekNum > 18) return [];
      else return currentdisArr.sort((a, b) => { return a.POSITION - b.POSITION });
    }

  }


  updateDay = async (newDate) => {
    const { disArr, currentDay, weekNum } = this.state;
    //расчет текущей недели
    let weekOffset = (newDate.getWeek() - currentDay.getWeek());
    let newWeekNum = weekNum + weekOffset;
    const currentdisArr = await this.findCurrentDisciplines(disArr, newDate, newWeekNum);
    this.setState({ currentdisArr: currentdisArr, currentDay: newDate, weekNum: newWeekNum, isExtended: false });
  }

  makeIdsArray(discipline) {
    var ids = [];
    if (discipline.ID_TEACHER1) ids.push(parseInt(discipline.ID_TEACHER1));
    if (discipline.ID_TEACHER2) ids.push(parseInt(discipline.ID_TEACHER2));
    if (discipline.ID_TEACHER3) ids.push(parseInt(discipline.ID_TEACHER3));
    if (discipline.ID_TEACHER4) ids.push(parseInt(discipline.ID_TEACHER4));
    return ids;
  }

  chooseDisciplineTeacher =(item)=>{
    this. setState({isExtended: true,
       START_TIME: item.START_TIME, 
       DAY_DATE:item.DAY_DATE,
       STUDY_GROUP:item.STUDY_GROUP})
  }

  chooseDiscipline = async (discipline) => {
    const ids = this.makeIdsArray(discipline);
    if (ids.length == 0)
      return;

    var teachers = [];
    try {
      for (const id of ids) {
        try {
          const data = { access_token_cookie: this.state.accessToken, refresh_token_cookie: this.state.refreshToken, id: id }

          let response = await fetch(baseURL + "/get_teacher_info", {
            mode: "cors",
            method: "POST",
            body: JSON.stringify(data),
            headers: {
              "Content-Type": "application/json",
            }
          })


          if (response.status == 200) {
            let teacher = (await response.json()).json;

            teachers.push(teacher[0]);
          }
          else if (response.status == 400) {
            this.props.appFunctions.tryRefreshToken(this.startWithToken)
          }
          else {
            let result = await response.json()
            console.log(result.message)
          }
        } catch (e) {
          console.log("catch chooseDiscipline: ", e.message)
        }

      }
    } catch (e) {
      console.error(e);
    }
    this.setState({ isExtended: true, teachersArr: teachers })
  }

  cancelDiscepline = async () => {
    this.setState({ teachersArr: [], isExtended: false });
  }

  onSwipeLeft(gestureState) {
    const { currentDay } = this.state;
    let newDate = new Date(currentDay);
    if (currentDay.getDay() == 0) newDate.setDate(currentDay.getDate() + 1);
    else newDate.setDate(currentDay.getDate() + 7);
    //console.log('swipe',newDate.getDate());
    this.updateDay(newDate);
  }

  onSwipeRight(gestureState) {
    const { currentDay } = this.state;
    let newDate = new Date(currentDay);
    if (currentDay.getDay() == 0) newDate.setDate(currentDay.getDate() - 6);
    else newDate.setDate(currentDay.getDate() - 7);
    //console.log('swipe',newDate.getDate());
    this.updateDay(newDate);
  }

  componentDidMount() {
    this.startWithToken()
  }
  
  
  startWithToken = async () => {
    try {
      const user_profile = JSON.parse(await AsyncStorage.getItem('userProfile'))
      const access_token = user_profile.access_token
      const refresh_token = user_profile.refresh_token
      const is_student = user_profile.is_student

      this.setState({ accessToken: access_token, refreshToken: refresh_token, isStudent: is_student })

      this.loadWeekNumber()
    } catch (e) {
      console.log("catched startWithToken", e.message)
      this.props.appFunctions.redirect({ accessToken: null, refreshToken: null, isStudent: null })
    }
  }

  loadStudentData = async () => {
    try {
      const data = { access_token_cookie: this.state.accessToken, refresh_token_cookie: this.state.refreshToken }

      let response = await fetch(baseURL + "/get_student_info", {
        mode: "cors",
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        }
      })


      if (response.status == 200) {
        let result = (await response.json()).json[0];

        var info = {
          ID: result.ID,
          SYM_GROUP: result.SYM_GROUP,
          SYM_FACULTET: result.SYM_FACULTET,
          NAME: result.NAME,
          SURNAME: result.SURNAME,
          PATRONYMIC: result.PATRONYMIC,
          ID_PLAN: result.ID_PLAN,
          YEAR_ADMISSION: result.YEAR_ADMISSION,
          ID_SPECIALIZATION: result.ID_SPECIALIZATION,
          ID_FACULTET: result.ID_FACULTET,
          ID_GROUP: result.ID_GROUP
        }
        this.setState(info)
        this.loadScheduleStudent()
      }
      else if (response.status == 400) {
        this.props.appFunctions.tryRefreshToken(this.startWithToken)
      }
      else {
        let result = await response.json()
        console.log(result.message)
      }
    } catch (e) {
      console.log("catch loadUserData: ", e.message)
    }
  }

  loadTeacherID = async () => {
    try {
      const data = { access_token_cookie: this.state.accessToken, refresh_token_cookie: this.state.refreshToken }

      let responseId = await fetch(baseURL + "/get_teacher_id", {
        mode: "cors",
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        }
      })

      if (responseId.status == 200) {
        let resultId = (await responseId.json()).json[0];

        var info = {
          ID: resultId.ID_PERSON
        }

        this.setState(info)
        this.loadTeacherData()
      }
      else if (responseId.status == 400) {
        this.props.appFunctions.tryRefreshToken(this.startWithToken)
      }
      else {
        let result = await responseId.json()
        console.log(result.message)
      }
    } catch (e) {
      console.log("catch loadTeacherID: ", e.message)
    }
  }

  loadTeacherData = async () => {
    try {
      const data = { access_token_cookie: this.state.accessToken, refresh_token_cookie: this.state.refreshToken, id: this.state.ID }

      let response = await fetch(baseURL + "/get_teacher_info", {
        mode: "cors",
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        }
      })


      if (response.status == 200) {
        let result = (await response.json()).json[0];

        var info = {
          ID: result.ID,
          NAME: result.NAME,
          SURNAME: result.SURNAME,
          PATRONYMIC: result.PATRONYMIC,
          FIO: result.FIO,
          DEGREE: result.DEGREE,
          POST: result.POST,
          MAIN_SUBDIVISION: result.MAIN_SUBDIVISION,
          CABINET: result.CABINET,
          EMAIL: result.EMAIL,
          SITE_LINK: result.SITE_LINK,
          PORTRAIT_URL: result.PORTRAIT_URL,
        }
        this.setState(info)
        this.loadScheduleTeacher()
      }
      else if (response.status == 400) {
        this.props.appFunctions.tryRefreshToken(this.startWithToken)
      }
      else {
        let result = await response.json()
        console.log(result.message)
      }
    } catch (e) {
      console.log("catch loadUserData: ", e.message)
    }
  }

  loadScheduleStudent = async () => {
    try {
      const data = { access_token_cookie: this.state.accessToken, refresh_token_cookie: this.state.refreshToken, id: this.state.ID_GROUP }

      let response = await fetch(baseURL + "/student_schedule", {
        mode: "cors",
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        }
      })

      if (response.status == 200) {
        let result = (await response.json()).json;

        const disArr = result
        const currentdisArr = await this.findCurrentDisciplines(disArr);

        this.setState({ disArr, currentdisArr });
      }
      else if (response.status == 400) {
        this.props.appFunctions.tryRefreshToken(this.startWithToken)
      }
      else {
        let result = await response.json()
        console.log(result.message)
      }
    } catch (e) {
      console.log("catch loadScheduleStudent: ", e.message)
    }
  }

  loadScheduleTeacher = async () => {
    try {
      const data = { access_token_cookie: this.state.accessToken, refresh_token_cookie: this.state.refreshToken, id: this.state.ID }

      let response = await fetch(baseURL + "/teacher_schedule", {
        mode: "cors",
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        }
      })

      if (response.status == 200) {
        let result = (await response.json()).json;

        const disArr = result
        const currentdisArr = await this.findCurrentDisciplines(disArr);

        this.setState({ disArr: disArr, currentdisArr: currentdisArr });
      }
      else if (response.status == 400) {
        this.props.appFunctions.tryRefreshToken(this.startWithToken)
      }
      else {
        let result = await response.json()
        console.log(result.message)
      }
    } catch (e) {
      console.log("catch loadScheduleTeacher: ", e.message)
    }
  }

  loadWeekNumber = async () => {
    try {
      const data = { access_token_cookie: this.state.accessToken, refresh_token_cookie: this.state.refreshToken }

      let response = await fetch(baseURL + "/week_num", {
        mode: "cors",
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        }
      })

      if (response.status == 200) {
        let result = (await response.json()).json[0];

        this.setState({ weekNum: result.WEEK });

        
        if (this.state.isStudent)
          this.loadStudentData()
        else
          this.loadTeacherID()
      }
      else if (response.status == 400) {
        this.props.appFunctions.tryRefreshToken(this.startWithToken)
      }
      else {
        let result = await response.json()
        console.log(result.message)
      }
    } catch (e) {
      console.log("catch loadWeekNumber: ", e.message)
    }
  }

  createChat = async (id) => {
    //this.props.navigation.navigate('chats')
    try{
      const data = {access_token_cookie:this.state.accessToken,
        refresh_token_cookie:this.state.refreshToken, id: id}

      let response = await fetch(baseURL+"/chat/create_chat",{
        mode: "cors",
        method:"POST",
        body: JSON.stringify(data),
        headers:{
          "Content-Type": "application/json",
        }
      })

      if(response.status == 200){
        let result = (await response.json()).json[0];
        this.props.navigation.navigate('chat', { room_id: result.room_id, my_id: JSON.stringify(result.my_id) })
      }
      else if(response.status == 400){
        this.props.appFunctions.tryRefreshToken(this.startWithToken)
      }
      else{
        let result = await response.json()
        console.log(result.message)
      }
    } catch (e) {
      console.log("catch createChat: ",e.message)
    }
  }

  render() {
    const { disArr, currentdisArr, currentDay, weekNum, isExtended,isStudent, teachersArr } = this.state;
    const { scheduleListStyle, dayListStyle, description, textTitleStyle, underline } = styles;
    //console.log('teachersrender', teachersArr);
    //console.log(h, w)

    //жесты
    const config = {
      velocityThreshold: 0.3,
      directionalOffsetThreshold: 80
    };

    //вычисление дат для dayIcon
    var DayIconArr = [];
    var mondayDate = new Date(currentDay);
    if (currentDay.getDay() == 0) {
      mondayDate.setDate(currentDay.getDate() - 6);
    } else {
      mondayDate.setDate(currentDay.getDate() - currentDay.getDay() + 1);
    }
    for (let index = 0; index < 6; index++) {
      let dateInWeek = new Date(mondayDate);
      dateInWeek.setDate(mondayDate.getDate() + index);
      DayIconArr.push(dateInWeek);
    }
    // var nextMondayDate = new Date(mondayDate);
    // nextMondayDate.setDate(mondayDate.getDate()+7);

    return (
      <View style={{ backgroundColor: backgroundColor, height: "100%" }}>
        {/* описание */}
        <View style={description}>
          <Text style={textTitleStyle}> {currentDay.getDate()} {currentDay.getMonthName()}{(weekNum < 0 || weekNum > 18) ? null : ', ' + weekNum + ' неделя'} </Text>
          <ModalDatePicker
            color={theme.colors.accent}
            button={<MaterialCommunityIcons name='calendar-month-outline' size={componentTitleSize + 10} color={theme.colors.text2} />}
            locale="ru"
            onSelect={(newdate) => this.updateDay(newdate)}
            isHideOnSelect={true}
            initialDate={this.state.currentDay}
            language={require('./ru.json')}
          />
        </View>

        {/* расширенная инфа о предмете, либо список дисциплин */}
        {isExtended ?
        isStudent?
          <ScrollView style={scheduleListStyle}>
            <View>
              <Text style={[underline, textTitleStyle]} >ПРЕПОДАВАТЕЛИ</Text>
              {teachersArr.map((item, index) =>
                <View key={item.ID}>
                  <DisciplineInfo teacher={item} />
                  <ActionItem text={'ЧАТ'} onPress={() => this.createChat(item.ID)} />
                </View>
              )}
              <ActionItem text={'НАЗАД'} onPress={this.cancelDiscepline} />
            </View>
            </ScrollView> :
            <ScrollView style={scheduleListStyle}>
              <View>
                <ActionItem text={'ДОБАВИТЬ ЗАДАНИЕ'}
                  onPress={() => this.props.navigation.navigate('addTask',{ date: this.state.DAY_DATE, time: this.state.START_TIME, group: this.state.STUDY_GROUP })} />
                <ActionItem text={'НАЗАД'} onPress={this.cancelDiscepline} />
              </View>
              
            </ScrollView>
          :
          <ScrollView style={scheduleListStyle}>
            <View>
              {
                currentdisArr.length == 0 ?
                  <Text style={[underline, textTitleStyle]}>НЕТ ЗАНЯТИЙ</Text>
                  :
                  currentdisArr.map((item, index) =>
                  <Discipline discipline={item} isStudent={this.state.isStudent}
                  onPress={this.state.isStudent ? this.chooseDiscipline : () => this.chooseDisciplineTeacher(item)} key={index} />
                  )
              }
            </View>
          </ScrollView>
        }

        <GestureRecognizer
          onSwipeLeft={(state) => this.onSwipeLeft(state)}
          onSwipeRight={(state) => this.onSwipeRight(state)}
          config={config} >
          {/* список дней */}
          <View style={dayListStyle}>
            {
              DayIconArr.map((item, index) => {
                return item.getDate() === currentDay.getDate() ?
                  <DayIcon date={item} key={index} isChosen={true} />
                  :
                  <DayIcon date={item} onPress={this.updateDay} key={index} />
              })
            }
            {/* <DayIcon date={nextMondayDate} onPress={this.updateDay} /> */}
          </View>
        </GestureRecognizer>

      </View>
    );
  }
}


const styles = StyleSheet.create({
  scheduleListStyle: {
    height: "75%",
    backgroundColor: theme.colors.background,
  },
  dayListStyle:
  {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
  },
  description: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: paddingComponent,
    marginVertical: marginComponent
  },
  textTitleStyle: {
    color: theme.colors.text2,
    fontSize: componentTitleSize
  },
  underline: {
    textAlign: 'center',
  }
});
export default ScheduleActivity