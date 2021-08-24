// App.js - WEB
import React, { Component } from "react";
import { View, Button, StyleSheet } from "react-native";

import WebRoutesGenerator from "./NativeWebRouteWrapper";
import { ModalContainer } from "react-router-modal";

import TopNavStudent from "./TopNavStudent"
import TopNavTeacher from "./TopNavTeacher"

import AuthActivity from "./authorization_module/AuthActivity"
import ChatRoomsActivity from "./chat_module/ChatRoomsActivity"
import ChatActivity from "./chat_module/ChatActivity"
import ConverterActivity from "./converter_module/ConverterActivity"
import ScheduleActivity from './schedule_module/ScheduleActivity';
import StudentActivity from './student_module/StudentActivity';
import TeacherActivity from './teacher_module/TeacherActivity';
import TaskActivity from './task_module/TaskActivity';
import AddTaskActivity from './task_module/AddTaskActivity';
import SplashActivity from "./SplashActivity"

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  baseURL, mainColor
} from './constants'


class App extends Component {
  constructor(props) {
    super(props);
    this.state={
      isLoading: true,
      isStudent: true,
      accessToken: null,
      refreshToken: null
    }

    this._isMounted = false;
  }

  componentDidMount(){
    this._isMounted = true;
    this.getToken()

    window.addEventListener("resize", this.resize.bind(this));
    this.resize();
  }
  resize() {
    this._isMounted && this.setState({innerWidth: window.innerWidth});
  }
  componentWillUnmount() {
      window.removeEventListener("resize", this.resize.bind(this));
      this._isMounted = false;
  }

  checkToken(accessToken, refreshToken){
    return !(accessToken && refreshToken)
  }

  getToken = async () => {
    try {
      const user_profile = JSON.parse(await AsyncStorage.getItem('userProfile'))
      const access_token = user_profile.access_token
      const refresh_token = user_profile.refresh_token
      const is_student = user_profile.is_student
      
      this._isMounted && this.setState({accessToken:access_token, refreshToken:refresh_token, isStudent:is_student})
      console.log("saved info:")
      console.log("accessToken:", access_token)
      console.log("refreshToken:", refresh_token)
      console.log("isStudent:", is_student)
    } catch(e) {
    }
    this._isMounted && this.setState({isLoading:false})
  }

  tryRefreshToken = async(callback) =>{
      console.log("tryRefreshToken!", callback)

      const data = {access_token_cookie:this.state.accessToken,refresh_token_cookie:this.state.refreshToken}

      if(!data.refresh_token_cookie) {
          console.log("null refresh_token_cookie when refresh")
          return;
      }
      
      let response = await fetch(baseURL+"/refresh_token",{
        mode: "cors",
        method:"PUT",
        body: JSON.stringify(data),
        headers:{
          "Content-Type": "application/json",
        }
      })

      
      if(response.status == 200){
        let result = (await response.json());

        await AsyncStorage.setItem('userProfile', JSON.stringify({access_token:result.access_token, refresh_token:result.refresh_token, is_student:this.state.isStudent}))
        this.appFunctions.redirect({accessToken:result.access_token, refreshToken:result.refresh_token, isStudent:this.state.isStudent})

        setTimeout(()=>{callback();},250)
      }
      else if(response.status == 400){
        try {
            await AsyncStorage.removeItem('userProfile')

            this.appFunctions.redirect({accessToken:null, refreshToken:null, isStudent:null})
        } catch (e) {
        }
      }
      else{
        let result = await response.json()
        console.log(result.message)
      }
  }

  setToken = async({accessToken, refreshToken, isStudent}) =>{
    this._isMounted && this.setState({accessToken:accessToken, refreshToken:refreshToken, isStudent:isStudent})
  }

  appFunctions = {redirect: this.setToken, tryRefreshToken:this.tryRefreshToken}

  render() {
    const {isLoading, isStudent, accessToken, refreshToken}=this.state;
    if (isLoading) {
      return <SplashActivity style={{ height: "100vh", width: "100vw" }} />;
    }

     const routeMapStudent = {
       Home: {
         component: StudentActivity,
         path: "/app",
         exact: true
       },
       Schedule: {
         component: ScheduleActivity,
         path: "/app/schedule"
       },
       Converter: {
         component: ConverterActivity,
         path: "/app/converter",
       },
       ChatRooms: {
        component: ChatRoomsActivity,
        path: "/app/rooms",
      },
       Chat: {
         component: ChatActivity,
         path: "/app/chat/room_id=:room_id?&my_id=:my_id?",
       }
     };
    
     const routeMapTeacher = {
       Home: {
         component: TeacherActivity,
         path: "/app",
         exact: true
       },
       Schedule: {
         component: ScheduleActivity,
         path: "/app/schedule"
       },
       AddTask: {
        component: AddTaskActivity,
        path: "/app/add_task/date=:date?&time=:time?&group=:group?",
      },
       Converter: {
         component: ConverterActivity,
         path: "/app/converter",
       },
       ChatRooms: {
        component: ChatRoomsActivity,
        path: "/app/rooms",
      },
       Chat: {
         component: ChatActivity,
         path: "/app/chat/room_id=:room_id?&my_id=:my_id?",
       }
     };

    const routeMap = isStudent? routeMapStudent: routeMapTeacher

    return (
      <View style={{ height: "100vh", width: "100vw" }}>
        {
          this.checkToken(accessToken, refreshToken) ?
            <AuthActivity 
            appFunctions = {this.appFunctions}/>
            :
            isStudent ?
              <View style={{ height: "100vh", width: "100vw" }}>
                <TopNavStudent />
                {WebRoutesGenerator({routeMap:routeMap, appFunctions: this.appFunctions })}
              </View>
              :
              <View style={{ height: "100vh", width: "100vw" }}>
                <TopNavTeacher />
                {WebRoutesGenerator({routeMap:routeMap, appFunctions: this.appFunctions })}
              </View>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    backgroundColor: mainColor
  }
});


export default App;








// const routeMap = {
//   Home: {
//     component: HomeScreen,
//     path: "/",
//     exact: true
//   },
//   Second: {
//     component: SecondScreen,
//     path: "/second"
//   },
//   Schedule: {
//     component: ScheduleActivity,
//     path: "/schedule"
//   },
//   User: {
//     component: UserScreen,
//     path: "/user/:name?",
//     exact: true
//   },
//   DasModal: {
//     component: DasModalScreen,
//     path: "*/dasmodal",
//     modal: true
//   }
// };