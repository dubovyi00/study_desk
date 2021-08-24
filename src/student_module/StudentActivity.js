import React from "react";

import { View, Text, StyleSheet, Image, Color, Platform, ScrollView,Button,Linking,ToastAndroid,TouchableOpacity } from "react-native";

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getDocumentAsync } from "expo-document-picker"
import * as FileSystem from 'expo-file-system';

import {
  baseURL, marginComponent, paddingComponent, theme, DEFAULT_STUDENT_PORTRAIT
} from '../constants'

import ThemedCard from "../components/ThemedCard"

import AsyncStorage from '@react-native-async-storage/async-storage';
import { keyFor } from "core-js/fn/symbol";

var bufferedState = null

var bufferedSolutions =[]


class StudentActivity extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      isExtended:null,
      accessToken: null,
      refreshToken: null,
      isStudent: null,
      solutions: [],
      ID: null,
      SYM_GROUP: null,
      SYM_FACULTET: null,
      NAME: null,
      SURNAME: null,
      PATRONYMIC: null,
      ID_PLAN: null,
      YEAR_ADMISSION: null,
      ID_SPECIALIZATION: null,
      ID_FACULTET: null,
      ID_GROUP: null,

      activatedExitButton: false,
    }
  }

  startWithToken = async () => {
    try {
      const user_profile = JSON.parse(await AsyncStorage.getItem('userProfile'))
      const access_token = user_profile.access_token
      const refresh_token = user_profile.refresh_token
      const is_student = user_profile.is_student
      
      this._isMounted && this.setState({accessToken:access_token, refreshToken:refresh_token, isStudent:is_student})

      this.loadUserData()
      this.loadUserTasks()
    } catch(e) {
      console.log("catched startWithToken", e.message)
      this.props.appFunctions.redirect({accessToken:null, refreshToken:null, isStudent:null})
    }
  }


  loadUserData = async() =>{
    try {
      const data = {access_token_cookie:this.state.accessToken,refresh_token_cookie:this.state.refreshToken}
      
      let response = await fetch(baseURL+"/get_student_info",{
        mode: "cors",
        method:"POST",
        body: JSON.stringify(data),
        headers:{
          "Content-Type": "application/json",
        }
      })

      
      if(response.status == 200){
        let result = (await response.json()).json[0];

        var info = {
          ID:result.ID,
          SYM_GROUP:result.SYM_GROUP,
          SYM_FACULTET:result.SYM_FACULTET,
          NAME:result.NAME,
          SURNAME:result.SURNAME,
          PATRONYMIC:result.PATRONYMIC,
          ID_PLAN:result.ID_PLAN,
          YEAR_ADMISSION:result.YEAR_ADMISSION,
          ID_SPECIALIZATION:result.ID_SPECIALIZATION,
          ID_FACULTET:result.ID_FACULTET,
          ID_GROUP:result.ID_GROUP
        }
        bufferedState = JSON.parse(JSON.stringify(info))
        this._isMounted && this.setState(info)
      }
      else if(response.status == 400){
        this._isMounted && this.props.appFunctions.tryRefreshToken(this.startWithToken)
      }
      else{
        let result = await response.json()
        console.log(result.message)
      }
    } catch (e) {
      console.log("catch loadUserData: ",e.message)
    }
  }

  
  loadUserTasks = async() =>{
    try {
      const data = {access_token_cookie:this.state.accessToken,refresh_token_cookie:this.state.refreshToken}
      
      let response = await fetch(baseURL+"/solutions_list",{
        mode: "cors",
        method:"PUT",
        body: JSON.stringify(data),
        headers:{
          "Content-Type": "application/json",
        }
      })
      
      if(response.status == 200){
        let result = (await response.json());

        bufferedSolutions = result.data
        this._isMounted && this.setState({
          solutions: result.data
        })
      }
      else if(response.status == 400){
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


//////
  
DownloadFile = async (file) => {
    var tmp = file?.path
    var url
    if(tmp) url = tmp
    else{

      url = bufferedSolutions[file]?.file?.path
    }
    console.log("download",url)
    await Linking.openURL(url)
  }

  ItemDelete = async (key) => {
    bufferedSolutions = bufferedSolutions.map(function(item,index) { return index == key ? {...item,status:0, file:{}} : item });
    this.setState({ solutions: bufferedSolutions })
  }

  ChooseFile = async (key) => {
    getDocumentAsync({
      multiple: false,
      copyToCacheDirectory: true,
      type: "*/*" // all files
    }).then((file) => {
      if (file.type != "success")
        return;

      file.type = file.name.indexOf(".")<0? "": (/\.([0-9a-z]+)(?:[\?#]|$)/.exec(file.name)[0].toLocaleLowerCase());
      file.extension = file.type.substring(1)

      const DEFAULT_TYPES = "pdf;"
      const IMAGE_TYPES = "png;jpg;jpeg"
      const TEXT_TYPES = "txt;c;h;cpp;cs;java;json;js;php;py;asm;sql;html;xml;yaml;md"
      const DOC_TYPES = "xlsx;xlsm;xlsb;xlam;xltx;xltm;xls;xlt;xla;xlm;xlw;odc;ods;prn;csv;dsn;mdb;mde;accdb;accde;dbc;iqy;dqy;rqy;oqy;cub;atom;atomsvc;dbf;xll;xlb;slk;dif;xlk;bak;pptx;ppt;pptm;ppsx;pps;ppsm;potx;pot;potm;odp;thmx;docx;docm;doc;ppam;ppa;docx;docm;dotx;dotm;doc;odt;docx;docm;doc;dotx;dotm;dotx;dotm;rtf;odt;doc;wpd;doc";

      
      var isAllowedType = false;

      if(DEFAULT_TYPES.split(";").indexOf(file.extension)!=-1)
          isAllowedType = true;

      if(DOC_TYPES.split(";").indexOf(file.extension)!=-1)
          isAllowedType = true;
          
      if(IMAGE_TYPES.split(";").indexOf(file.extension)!=-1)
          isAllowedType = true;
          
      if(TEXT_TYPES.split(";").indexOf(file.extension)!=-1) {
          isAllowedType = true;
      }

      if (!isAllowedType) {
        alert("Неверное расширение документа")
        return;
      }
      var i = this.searchBufferedSolutions(key)
      var newBufSolutions = bufferedSolutions.map((item,index)=>{
        return index == i ? {...item, status:3,file:file} : item
      })

      if (Platform.OS == "web") {
        bufferedSolutions = newBufSolutions
        this.setState({ solutions: newBufSolutions })
      } else {
        var fileLoc = file.uri

        FileSystem.readAsStringAsync(fileLoc, {encoding:"base64"})
            .then(raw=>{
              var uriFile = "data:application/vnd.custom-type;base64," + raw
                
              file.uri = uriFile
              bufferedSolutions = newBufSolutions
              this.setState({ solutions: newBufSolutions })
            })
            .catch(e=>console.log("wtf error"))
      }
      console.log('chhose',bufferedSolutions)
    }).catch((err) => {
      console.error("Ошибка", err);
    })
  }

  addFile =(key)=>{
    this.ChooseFile(key)
  }

 Confirm = async(key)=>{
  var i = this.searchBufferedSolutions(key)
  if (!bufferedSolutions[i].file)
  return

  var data = JSON.stringify({access_token:this.state.accessToken,refresh_token:this.state.refreshToken,
    id:bufferedSolutions[i]._id, files:[bufferedSolutions[i].file]})
  
  try {
    let response = await fetch(baseURL + "/upload_solution", {
      mode: "cors",
      method: 'POST',
      headers: {
        "Content-Type": 'application/vnd.custom-type'
      },
      body: data,
    });

    console.log("response", response)

    if (response.status == 200) {
      let result = (await response.json());
      this.loadUserTasks();
      bufferedSolutions = bufferedSolutions.map(function(item,index) { return index == i ? {...item,file:result.data, status:1} : item });
      this.setState({solutions:bufferedSolutions})
    }
    else if (response.status == 401) {
      this.props.appFunctions.tryRefreshToken(this.startWithToken)
    }
    else {
      let result = await response.json()
      console.log(result.message)
      alert(result.message)
    }
    this.setState({ isLoading: false })
  } catch (err) {
    console.log('Ошибка', err);
    alert("Возникла ошибка при обработке!")
  }
 }

  componentDidMount(){
      this._isMounted = true;
      this.startWithToken()
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  searchBufferedSolutions(id){
    return id;
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
    const image = { uri: DEFAULT_STUDENT_PORTRAIT };

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
        {bufferedState?
          <View style={styles.profile_fields_box}>
            <Text style={styles.field_name}>{bufferedState.SURNAME} {bufferedState.NAME} {bufferedState.PATRONYMIC}</Text>
            <Text style={styles.field_group}>{bufferedState.SYM_FACULTET}, Группа {bufferedState.SYM_GROUP}</Text>
          </View>:<View/>
        }
    </View>

    let extendButton = (key) => {
      var index = this.searchBufferedSolutions(key)
      var result
      if (this.state.isExtended == index) result = null
      else result = index
      return <View style={styles.listItemButton}><Button title="Подробнее 𝌒"
        onPress={() => this.setState({ isExtended: result }) } color={theme.colors.accent} /></View>
    }

    let addButton = (key) => {
      var index = this.searchBufferedSolutions(key)
      var item =bufferedSolutions[index]
      return <View style={styles.listItemButton}><Button title="+" disabled={item.status != 0? true:false}
        onPress={() => this.addFile(key)} color={theme.colors.accent} /></View>
    }

    let downloadButtton = (key, file = null) => {

      return <View style={styles.listItemButton}><Button color={theme.colors.accent}
        title="Открыть" onPress={() => this.DownloadFile(file?file:key)} /></View>
    }

    let confirmButton=(key)=>{
      return <View style={styles.listItemButton}><Button color={theme.colors.accent}
      title="Подтвердить ✓" onPress={() => this.Confirm(key)}/></View>
    }

    let deleteButton = (key) => {
      return <View style={styles.listItemButton}><Button
        title="⛌" onPress={() => this.ItemDelete(key)} color="#dc3545"/></View>
    }


    let extension = (prop, key) => {
      var index = this.searchBufferedSolutions(key)
      return this.state.isExtended == index ?
      <View>
        <Text style={styles.field_description}>{prop.description}</Text>
        {prop.methods.map((item,key)=>{
          return taskFiles(item,key)
        })}
        
      </View>
        :
        <></>
    }



    let taskFiles = (file,key) => {
      return <View style={styles.downloadFileBox} key={key}>
        <Text style={[styles.field_group,{paddingEnd: paddingComponent}]}>{file.name}</Text>
        {downloadButtton(key,file)}
      </View>
    }

    let solutionsListBox = (!bufferedSolutions) ? <View /> :
      bufferedSolutions.map((prop, key) => {
        var status,file,fileName
        switch (prop.status) {
          case 0:
            status = "Не сдано";
            break;
          case 1:
            status = "На проверке";
            break;
          case 2:
            status = "Проверено";
            break;
          case 3:
            status = "Подтвердите отправку";
            break;
        }
        
        if(prop.file){
          fileName = prop.file.name
        }

        var date = new Date(prop.date)
        var minutes = date.getMinutes() == 0 ? '00': date.getMinutes()
        var strDate = date.getDate()+'.'+ date.getMonth() +'.'+ date.getFullYear()+' '+date.getHours()+':'+ minutes

        var innerText =
        (<View style={styles.listview}>
          <Text style={styles.listItemHeader}>
            {key + 1}. {prop.title} до {strDate} ({status})
          </Text>
          <Text style={styles.listItemHeader}>
            {extension(prop, key)}
          </Text>
          <View style ={styles.buttons}>
          {fileName &&(<><MaterialCommunityIcons color={theme.colors.text2} name="file" size={24} /><Text style={styles.field_task}>{fileName}</Text></>)}
          {prop.status == 1 && downloadButtton(key)}
          {prop.status == 3 && confirmButton(key)}
          {(prop.status == 3) && deleteButton(key)}
          </View>
        </View>)

        return (
        <View style={styles.solutionsListBox} key={key}>
          {innerText}
          <View style ={styles.buttons}>
          {extendButton(key)}
          {prop.status == 0 && addButton(key)}
          </View>
          
        </View>
        );
      })



    let solutionsBox = !bufferedState ? <View style={styles.field_info} /> :
  <View style={styles.field_info}>
        <Text style={styles.field_name}>Состояние отправленных работ:</Text>
        {solutionsListBox}
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
  profile_fields_box: {
    flexDirection: 'column',
    flexShrink:1,
    justifyContent: "center",
    alignItems: "center",
    maxWidth:700,
  },
  field_name: {
    margin: 8,
    flexShrink:1,
    fontSize: 20,
    color: theme.colors.text,
    fontWeight: "bold",
  },
  field_description: {
    flexShrink:1,
    flexDirection:"column",
    flex:1,
    color: theme.colors.text2,
    fontWeight: "bold",
  },
  field_group: {
    fontSize: 18,
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
  downloadFileBox: {
    alignItems:'center',
    justifyContent:"center",
    marginTop: marginComponent,
    flexDirection: 'row',
  },
  solutionsListBox:{
    margin: marginComponent,
  },
  listview: {
    backgroundColor: theme.colors.background,
    borderRadius: 4,
    alignItems: "center",
    flexDirection: "column",
    margin: 4,
    flex: 1,
  },
  field_task:{
    color:theme.colors.text2,
  },
  buttons:{
    margin: marginComponent,
    flexDirection: 'row',
    flexWrap: "wrap",
    alignItems:'center',
    justifyContent: "center",
    flex: 1,
  }
});

export default StudentActivity;
