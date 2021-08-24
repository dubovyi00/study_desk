// App.js - React Native
import 'react-native-gesture-handler';
import 'react-native-safe-area-context';

import React, { Component } from "react";

import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack'
import { useRoute } from '@react-navigation/native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import AuthActivity from "./authorization_module/AuthActivity"
import ChatActivity from "./chat_module/ChatActivity"
import ChatRoomsActivity from "./chat_module/ChatRoomsActivity"
import ConverterActivity from "./converter_module/ConverterActivity"
import ScheduleActivity from './schedule_module/ScheduleActivity';
import StudentActivity from './student_module/StudentActivity';
import TeacherActivity from './teacher_module/TeacherActivity';
import SplashActivity from "./SplashActivity"

import { baseURL, theme } from './constants';

import AsyncStorage from '@react-native-async-storage/async-storage';
import AddTaskActivity from './task_module/AddTaskActivity';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function getHeaderTitle(route) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'main';
  switch (routeName) {
    case 'main':
      return 'Личный профиль';
    case 'converter':
      return 'Конвертер';
    case 'chat':
      return 'Чат';
    case 'chats':
      return 'Чаты';
    case 'schedule':
      return 'Расписание';
    case 'task':
      return 'Задание';
  }
}

function HomeStudent() {
  const route = useRoute();
  
  return (
    <Tab.Navigator backBehavior={'initialRoute'} 
    screenOptions={({ route }) => ({
      
      tabBarIcon: ({color, size }) => {
        let iconName;

        if (route.name === 'main') {
          iconName = 'account-circle-outline';
        } else if (route.name === 'schedule') {
          iconName = 'timetable';
        } else if (route.name === 'chats') {
          iconName = 'chat-outline';
        } else if (route.name === 'converter') {
          iconName = 'file-compare';
        }
        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      },
    })}
    tabBarOptions={{
      activeTintColor: theme.colors.accent,
      inactiveTintColor: theme.colors.text2,
    }}
    >
      <Tab.Screen name="main"
        //component={StudentActivity}
        children={(props)=><StudentActivity {...props} appFunctions={this.appFunctions}/>}
        options={{ title: 'Главная' }}
      />
      <Tab.Screen name="schedule"
        initialParams={{accessToken: route.params.accessToken,refreshToken: route.params.refreshToken}}
        //component={ScheduleActivity}
        children={(props)=><ScheduleActivity {...props} appFunctions={this.appFunctions}/>}
        options={{ title: 'Расписание' }}
      />
      <Tab.Screen name="chats"
        initialParams={{accessToken: route.params.accessToken,refreshToken: route.params.refreshToken}}
        //component={ChatRoomsActivity}
        children={(props)=><ChatRoomsActivity {...props} appFunctions={this.appFunctions}/>}
        options={{ title: 'Чаты' }}
      />
      <Tab.Screen name="converter"
        //component={ConverterActivity}
        children={(props)=><ConverterActivity {...props} appFunctions={this.appFunctions}/>}
        options={{ title: 'Конвертер' }}
      />
    </Tab.Navigator>
  );
}

function HomeTeacher() {
  const route = useRoute();
  
  return (
    <Tab.Navigator  backBehavior={'initialRoute'}
    screenOptions={({ route }) => ({
      tabBarIcon: ({color, size }) => {
        let iconName;

        if (route.name === 'main') {
          iconName = 'account-circle-outline';
        } else if (route.name === 'chats') {
          iconName = 'chat-outline';
        } else if (route.name === 'task') {
          iconName = 'file-document-outline';
        } else if (route.name === 'schedule') {
          iconName = 'timetable';
        } else if (route.name === 'converter') {
          iconName = 'file-compare';
        }

        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      },
    })}
    tabBarOptions={{
      activeTintColor: theme.colors.accent,
      inactiveTintColor: theme.colors.text2,
    }}
    >
      <Tab.Screen name="main"
        //component={TeacherActivity}
        children={()=><TeacherActivity appFunctions={this.appFunctions}/>}
        options={{ title: 'Главная' }}
      />
      <Tab.Screen name="chats"
        initialParams={{accessToken: route.params.accessToken,refreshToken: route.params.refreshToken}}
        //component={ChatRoomsActivity}
        children={(props)=><ChatRoomsActivity {...props} appFunctions={this.appFunctions}/>}
        options={{ title: 'Чаты' }}
      />
      <Tab.Screen name="schedule"
        initialParams={{accessToken: route.params.accessToken,refreshToken: route.params.refreshToken}}
        //component={ScheduleActivity}
        children={(props)=><ScheduleActivity {...props} appFunctions={this.appFunctions}/>}
        options={{ title: 'Расписание' }}
      />
      <Tab.Screen name="converter"
        //component={ConverterActivity}
        children={()=><ConverterActivity appFunctions={this.appFunctions}/>}
        options={{ title: 'Конвертер' }}
      />
    </Tab.Navigator>
  );
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state={
      isLoading: true,
      isStudent: true,
      accessToken: null,
      refreshToken: null
    }
  }

  componentDidMount(){
    this.getToken()
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
      
      this.setState({accessToken:access_token, refreshToken:refresh_token, isStudent:is_student})
      console.log("saved info:")
      console.log("accessToken:", access_token)
      console.log("refreshToken:", refresh_token)
      console.log("isStudent:", is_student)
    } catch(e) {
    }
    this.setState({isLoading:false})
  }
  
  setToken = async({accessToken, refreshToken, isStudent}) =>{
    this.setState({accessToken:accessToken, refreshToken:refreshToken, isStudent:isStudent})
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
      console.log("result", result)

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

  appFunctions = {redirect: this.setToken, tryRefreshToken:this.tryRefreshToken}

  render() {
    const {isLoading, isStudent, accessToken, refreshToken}=this.state;

    if (isLoading) {
      return <SplashActivity />;
    }

    return (
      <NavigationContainer theme={theme}>  
        {
          this.checkToken(accessToken, refreshToken) ?
            <Stack.Navigator>
              <Stack.Screen name="auth"
                options={{ title: 'Вход' }}>
                {(props) => <AuthActivity {...props} appFunctions={this.appFunctions} />}
              </Stack.Screen>
            </Stack.Navigator>
            :
            isStudent ?
              <Stack.Navigator>
                <Stack.Screen name="homeStudent"
                  children={HomeStudent}
                  initialParams={{accessToken: accessToken, refreshToken: refreshToken}}
                  appFunctions={this.appFunctions}
                  options={({ route }) => ({
                    headerTitle: getHeaderTitle(route)
                  })}
                />
                <Stack.Screen name="chat"
                  component={ChatActivity}
                  initialParams={{accessToken: accessToken, refreshToken: refreshToken}}
                  appFunctions={this.appFunctions}
                  options={({ route }) => ({
                    headerTitle: 'Чат'
                  })}
                />
              </Stack.Navigator>
              :
              <Stack.Navigator>
                <Stack.Screen name="homeTeacher"
                  children={HomeTeacher}
                  initialParams={{accessToken: accessToken, refreshToken: refreshToken}}
                  appFunctions={this.appFunctions}
                  options={({ route }) => ({
                    headerTitle: getHeaderTitle(route)
                  })}
                />
                <Stack.Screen name="chat"
                  component={ChatActivity}
                  initialParams={{accessToken: accessToken, refreshToken: refreshToken}}
                  appFunctions={this.appFunctions}
                  options={({ route }) => ({
                    headerTitle: 'Чат'
                  })}
                />
                <Stack.Screen name="addTask"
                  appFunctions={this.appFunctions}
                  initialParams={{ accessToken: accessToken, refreshToken: refreshToken }}
                  options={({ route }) => ({
                    headerTitle: 'Новое задание'
                  })} >
                  {(props) => <AddTaskActivity {...props} appFunctions={this.appFunctions} />}
                  </Stack.Screen>
              </Stack.Navigator>
        }
      </NavigationContainer>
    );
  }
}


export default App;



// function Home() {
//   return (
//     <Tab.Navigator>
//       <Tab.Screen name="Home" component={HomeScreen} />
//       <Tab.Screen name="Second" component={SecondScreen} />
//       <Tab.Screen name="Schedule" component={ScheduleActivity} />
//     </Tab.Navigator>
//   );
// }

// class App extends Component {
//   render() {
//     return (
//       <NavigationContainer>
//         <Stack.Navigator>
//           <Stack.Screen name="Home" children={Home} />
//           <Stack.Screen name="DasModal" component={DasModalScreen} />
//           <Stack.Screen name="User" component={UserScreen} />
//         </Stack.Navigator>
//       </NavigationContainer>
//     );
//   }
// }




