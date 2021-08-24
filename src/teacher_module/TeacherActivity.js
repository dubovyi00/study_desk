import React from "react";
import { View, Text, StyleSheet, Image, Color, Button,
  Linking, Platform, ScrollView, TouchableOpacity } from "react-native";

import {
  baseURL, theme, DEFAULT_TEACHER_PORTRAIT,
} from '../constants'

import ThemedCard from "../components/ThemedCard"

import { MaterialCommunityIcons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

var bufferedState = null
var bufferedSolutions =[]

class TeacherActivity extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      accessToken: null,
      refreshToken: null,
      isStudent: null,
      solutions: [],

      ID: null,
      NAME: null,
      SURNAME: null,
      PATRONYMIC: null,
      FIO: null,
      DEGREE: null,
      POST: null,
      MAIN_SUBDIVISION: null,
      CABINET: null,
      EMAIL: null,
      SITE_LINK: null,
      PORTRAIT_URL: null,

      activatedExitButton: false,
    }
  }

  startWithToken = async () => {
    try {
      const user_profile = JSON.parse(await AsyncStorage.getItem('userProfile'))
      const access_token = user_profile.access_token
      const refresh_token = user_profile.refresh_token
      const is_student = user_profile.is_student

      this._isMounted && this.setState({ accessToken: access_token, refreshToken: refresh_token, isStudent: is_student })

      this._isMounted && this.loadTeacherID()
    } catch (e) {
      console.log("catched startWithToken", e.message)
      this._isMounted && this.props.appFunctions.redirect({ accessToken: null, refreshToken: null, isStudent: null })
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

        this._isMounted && this.setState(info)
        this._isMounted && this.loadUserData()
        this._isMounted && this.loadUserTasks()
      }
      else if (responseId.status == 400) {
        this._isMounted && this.props.appFunctions.tryRefreshToken(this.startWithToken)
      }
      else {
        let result = await responseId.json()
        console.log(result.message)
      }
    } catch (e) {
      console.log("catch loadTeacherID: ", e.message)
    }
  }


  loadUserData = async () => {
    try {
      const data = { access_token_cookie: this.state.accessToken, refresh_token_cookie: this.state.refreshToken, id: 80087 }

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
        bufferedState = JSON.parse(JSON.stringify(info))
        this._isMounted && this.setState(info)
      }
      else if (response.status == 400) {
        this._isMounted && this.props.appFunctions.tryRefreshToken(this.startWithToken)
      }
      else {
        let result = await response.json()
        console.log(result.message)
      }
    } catch (e) {
      console.log("catch loadUserData: ", e.message)
    }
  }

  
  loadUserTasks = async() =>{
    try {
      const data = {access_token:this.state.accessToken,refresh_token:this.state.refreshToken}
      
      let response = await fetch(baseURL+"/executed_list",{
        mode: "cors",
        method:"PUT",
        body: JSON.stringify(data),
        headers:{
          "Content-Type": "application/json",
        }
      })
      
      if(response.status == 200){
        let result = (await response.json());

        bufferedSolutions = result
        this._isMounted && this.setState({
          solutions: result
        })
      }
      else if(response.status == 401){
        this._isMounted && this.props.appFunctions.tryRefreshToken(this.startWithToken)
      }
      else{
        let result = await response.json()
        console.log(result.message)
      }
    } catch (e) {
      console.log("catch loadUserTasks: ", e.message)
    }
  }



  ItemOpenInfo = async (key) => {
    var sol = bufferedSolutions[key]
    var url = sol.file.path
    await Linking.openURL(url);
  }

  SubmitTeacherAnswer = async (key, ans) => {
    var sol = bufferedSolutions[key]
    

    try {
      const data = {access_token:this.state.accessToken,refresh_token:this.state.refreshToken, conclusion:ans, solution_id:sol.solution_id}
      
      let response = await fetch(baseURL+"/upload_validation",{
        mode: "cors",
        method:"POST",
        body: JSON.stringify(data),
        headers:{
          "Content-Type": "application/json",
        }
      })
      
      if(response.status == 200){
        let result = (await response.json());
        
        this.loadUserTasks();
      }
      else if(response.status == 401){
        this._isMounted && this.props.appFunctions.tryRefreshToken(this.startWithToken)
      }
      else{
        let result = await response.json()
        console.log(result.message)
      }
    } catch (e) {
      console.log("catch loadUserTasks: ", e.message)
    }

  }

  ItemAccept = async (key) => {
    this.SubmitTeacherAnswer(key, false)
  }

  ItemDeny = async (key) => {
    this.SubmitTeacherAnswer(key, true)
  }


  componentDidMount() {
    this._isMounted = true;
    this.startWithToken()
  }
  componentWillUnmount() {
    this._isMounted = false;
  }

  exitApp = async() => {
    if (!this.state.activatedExitButton){
      this.setState({activatedExitButton:true})
      setTimeout(()=>{
        this._isMounted && this.setState({activatedExitButton:false})
      }, 1000)
      return
    }
    
    this._isMounted && await AsyncStorage.removeItem('userProfile')
    this._isMounted && this.props.appFunctions.redirect({accessToken:null, refreshToken:null, isStudent:null})
  }


  render() {
    const { navigation, accessToken, refreshToken } = this.props;

    const image = ((bufferedState == null || bufferedState.PORTRAIT_URL == null) ? DEFAULT_TEACHER_PORTRAIT : bufferedState.PORTRAIT_URL)
    
    let chairBox = (bufferedState == null || bufferedState.MAIN_SUBDIVISION == null)?<></>:
      <Text style={styles.field_group}>Кафедра: {bufferedState.MAIN_SUBDIVISION}</Text>

    let cabinetBox = (bufferedState == null || bufferedState.CABINET == null)?<></>:
      <Text style={styles.field_group}>Кабинет: {bufferedState.CABINET}</Text>

    let degreeBox = (bufferedState == null || (bufferedState.DEGREE == null && bufferedState.POST == null))?<></>:
      <Text style={styles.field_group}>{bufferedState.POST}{bufferedState.DEGREE?", " + bufferedState.DEGREE:""}</Text>
          

    let profileBox =
      <View style={styles.profileBox}>
        <View style={{position:"absolute", zIndex:2, right:0}}>
          <TouchableOpacity onPress={()=>this.exitApp()}>
            <MaterialCommunityIcons color={this.state.activatedExitButton? theme.colors.accent: theme.colors.text2} name="exit-to-app" size={24} />
          </TouchableOpacity>
        </View>
        <Image style={styles.img}
          source={image}
        />
        {bufferedState ?
          <View style={styles.profile_fields_box}>
            <Text style={styles.field_name}>{bufferedState.SURNAME} {bufferedState.NAME} {bufferedState.PATRONYMIC}</Text>
            {chairBox}
            {cabinetBox}
            {degreeBox}
          </View> : <View />
        }

      </View>

    
    
    let filesListView =
      bufferedSolutions.map((prop, key) => {
        console.log("next Prop", prop)
        var innerText = prop.title + " (" + prop.description + ")\n"+prop.student_name+", "+prop.group;
        return (
        <View style={styles.listview} key={key}>
          <View style={{ flex: 1 }}><Text style={styles.listItemHeader}>{innerText}</Text></View>
          <View style={styles.listItemButton}><Button title="𝌒" onPress={() => this.ItemOpenInfo(key)}/></View>
          <View style={styles.listItemButton}><Button title="✓" onPress={() => this.ItemAccept(key)}/></View>
          <View style={styles.listItemButton}><Button title="⛌" onPress={() => this.ItemDeny(key)} color="#dc3545"/></View>
        </View>);
      })

    let solutionsBox = !bufferedState? <View style={styles.field_info}/>:
    <View style={styles.field_info}>
        {bufferedSolutions.length==0?(<Text style={styles.field_checkedHeader}>Непроверенные работы отсутствуют</Text>):
        (<Text style={styles.field_checkedHeader}>Непроверенные работы:</Text>)}
        {bufferedSolutions.length==0?<View />:filesListView}
    </View>


    return (
      <ScrollView style={styles.mainScroll} contentContainerStyle={{flexDirection:'row', justifyContent: 'center'}}>
        <View style={styles.container}>
          <ThemedCard>
            {profileBox}
          </ThemedCard>
          <ThemedCard>
            {solutionsBox}
          </ThemedCard>
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
    paddingBottom:16,
    maxWidth:700,
    flex: 1,
  },
  profile_fields_box: {
    flexDirection: 'column',
    flexShrink:1,
    justifyContent: "center",
    alignItems: "center",
    maxWidth:700,
  },
  listview: {
    backgroundColor: theme.colors.background,
    borderRadius: 4,
    alignItems: "center",
    flexDirection: "row",
    margin: 4,
    flex: 1,
  },
  listItemHeader: {
    color: theme.colors.text2,
    margin: 10,
    ...Platform.select({
      android: {
        fontSize: 12,
      },
      default: {
        fontSize: 15,
      }
    }),
  },
  listItemButton: {
    ...Platform.select({
      android: {
        marginLeft: 6,
      },
      default: {
        marginLeft: 8,
      }
    }),
  },
  field_name: {
    flexShrink:1,
    fontSize: 20,
    color: theme.colors.text,
    fontWeight: "bold",
  },
  field_group: {
    fontSize: 18,
    color: theme.colors.text2
  },
  field_checkedHeader: {
    fontSize: 18,
    marginBottom: 8,
    color: theme.colors.text2
  },
  img: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 12,
    alignItems: "center"
  },
  profileBox: {
    flexDirection: 'row',
    flexWrap: "wrap",
    justifyContent: "center",
    flex: 1,
    maxWidth: 700,
  },
  field_info: {
    flexDirection: 'column',
    flex: 1,
    maxWidth: 700,
  }
});

export default TeacherActivity;
