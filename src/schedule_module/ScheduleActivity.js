import React, { Component } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet
} from 'react-native';


import { Calendar, LocaleConfig } from 'react-native-calendars'

import {
  DayIcon,
  Discipline,
  DisciplineInfo,
  ActionItem,
} from './components/index'

import {
  h, w,
  paddingBottomScroll,
  marginComponent,
  paddingComponent,
  componentTitleSize,
  textColor,
  backgroundColor,
  baseURL,
  borderRadius,
  boxShadow,
  domainURL,
  theme
} from '../constants'

import AsyncStorage from '@react-native-async-storage/async-storage';

// Returns the ISO week of the date.
Date.prototype.getWeek = function () {
  var date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  var week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
    - 3 + (week1.getDay() + 6) % 7) / 7);
}

Date.prototype.getMonthName = function () {
  var date = new Date(this.getTime());
  var months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return months[date.getMonth()];
}

LocaleConfig.locales['ru'] = {
  monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Августь', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  monthNamesShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  dayNames: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
  dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Суб'],
  today: 'Сегодня\'Сг'
};
LocaleConfig.defaultLocale = 'ru';

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

      START_TIME: null,
      DAY_DATE: null,
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

  chooseDisciplineTeacher = (item) => {
    this.setState({
      isExtended: true,
      START_TIME: item.START_TIME,
      DAY_DATE: item.DAY_DATE,
      STUDY_GROUP: item.STUDY_GROUP
    })
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

      if (data.id == null)
        return;

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

      if (data.id == null)
        return;

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
    //this.props.navigation.navigate('ChatRooms')
    try {
      const data = {
        access_token_cookie: this.state.accessToken,
        refresh_token_cookie: this.state.refreshToken, id: id
      }

      let response = await fetch(baseURL + "/chat/create_chat", {
        mode: "cors",
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        }
      })

      if (response.status == 200) {
        let result = (await response.json()).json[0];
        this.props.navigation.navigate('Chat', { room_id: result.room_id, my_id: result.my_id })
        //this.props.navigation.navigate('ChatRooms')
      }
      else if (response.status == 400) {
        this.props.appFunctions.tryRefreshToken(this.startWithToken)
      }
      else {
        let result = await response.json()
        console.log(result.message)
      }
    } catch (e) {
      console.log("catch createChat: ", e.message)
    }
  }

  render() {
    const { disArr, currentdisArr, currentDay, weekNum, isExtended, teachersArr, isStudent } = this.state;
    const { description, textTitleStyle, center, calendar } = styles;

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
    // console.log("is students schedule?", isStudent)

    // var nextMondayDate = new Date(mondayDate);
    // nextMondayDate.setDate(mondayDate.getDate()+7);

    var extraBox =
      <View style={{flex: 1, minWidth: 300}}>
        {isExtended ?
          (isStudent ?
            <View>
              <Text style={[center, textTitleStyle, {marginTop: 8}]}>ПРЕПОДАВАТЕЛИ</Text>
              {teachersArr.map((item, index) =>
                <View key={item.ID} style={{marginTop: 8}}>
                  <DisciplineInfo teacher={item} />
                  <ActionItem text={'ЧАТ'} onPress={() => this.createChat(item.ID)}/>
                </View>
              )}
              <ActionItem text={'НАЗАД'} onPress={this.cancelDiscepline} />
            </View> :
            <View style={{ alignItems: 'center' }}>
              <ActionItem text={'СОЗДАТЬ ЗАДАНИЕ'}
                onPress={() => this.props.navigation.navigate('AddTask',
                  { date: this.state.DAY_DATE, time: this.state.START_TIME, group: encodeURIComponent(this.state.STUDY_GROUP) })} />
              <ActionItem text={'НАЗАД'} onPress={this.cancelDiscepline} />
            </View>
          ) :
          <View>
            {
              currentdisArr.length == 0 ?
                <Text style={[center, textTitleStyle, {marginTop: 8}]}>НЕТ ЗАНЯТИЙ</Text>
                :
                currentdisArr.map((item, index) =>
                  <Discipline discipline={item} isStudent={this.state.isStudent}
                    onPress={this.state.isStudent ? this.chooseDiscipline : () => this.chooseDisciplineTeacher(item)} key={index} />
                )
            }
          </View>}
      </View>




    return (

      <ScrollView style={styles.mainScroll} contentContainerStyle={{ flexDirection: 'row', justifyContent: 'center' }}>
        <View style={styles.container}>
          {/* описание */}
          <View style={description}>
            <Text style={textTitleStyle}>Выбрано: {currentDay.getDate()} {currentDay.getMonthName()}{(weekNum < 0 || weekNum > 18) ? null : ', ' + weekNum + ' неделя'} </Text>
          </View>
          <View style={{
            flexDirection: "row", flexWrap: 'wrap',
            alignItems: 'flex-start', justifyContent: 'center',
          }}>
            <View>
              <Calendar
                style={calendar}
                onDayPress={(newdate) => { this.updateDay(new Date(newdate.year, newdate.month - 1, newdate.day)) }}
                current={this.state.currentDay}
                renderArrow={(direction) => <Text style={{ color: theme.colors.accent }}>{direction == 'left' ? '<' : '>'}</Text>}
                firstDay={1}
                theme={{
                  backgroundColor: theme.colors.card,
                  calendarBackground: theme.colors.card,
                  textSectionTitleColor: theme.colors.text2,
                  textSectionTitleDisabledColor: theme.colors.text2,
                  selectedDayBackgroundColor: theme.colors.accent,
                  selectedDayTextColor: theme.colors.text,
                  todayTextColor: theme.colors.accent,
                  dayTextColor: theme.colors.text,
                  textDisabledColor: theme.colors.text2,
                  dotColor: '#00adf5',
                  selectedDotColor: '#ffffff',
                  arrowColor: theme.colors.accent,
                  disabledArrowColor: '#d9e1e8',
                  monthTextColor: theme.colors.accent,
                  indicatorColor: theme.colors.accent,
                  textDayFontFamily: 'monospace',
                  textMonthFontFamily: 'monospace',
                  textDayHeaderFontFamily: 'monospace',
                  textDayFontWeight: '300',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '300',
                  textDayFontSize: 16,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 16
                }}
              />
            </View>
            {/* расширенная инфа о предмете, либо список дисциплин */}
            {extraBox}
          </View>
        </View>
      </ScrollView>
    );
  }
}


const styles = StyleSheet.create({
  mainScroll: {
    backgroundColor: theme.colors.background,
  },
  container: {
    paddingBottom: 16,
    maxWidth: 700,
    flex: 1,
  },
  dayListStyle:
  {
    flexDirection: 'row',
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
  center: {
    textAlign: 'center',
  },
  calendar: {
    margin: marginComponent,
    backgroundColor: theme.colors.card,
    borderRadius: borderRadius,
  }
});
export default ScheduleActivity