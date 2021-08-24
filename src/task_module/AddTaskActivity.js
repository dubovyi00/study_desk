import React from "react";
import { 
  View, Text, StyleSheet, Button, Platform, ScrollView, TextInput,ToastAndroid
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemedCard from '../components/ThemedCard'
import { Card } from "react-native-elements";

import {
  backgroundColor,
  baseURL,
  borderRadius,
  borderWidth,
  headerFontSize,
  marginComponent,
  paddingComponent,
  textColor,
  theme
} from '../constants'

import { getDocumentAsync } from "expo-document-picker"
import * as FileSystem from 'expo-file-system';

class AddTaskActivity extends React.Component {
  constructor(props) {
    super(props);
    // var today = new Date();
    // today.setHours(0, 0, 0, 0);

    this.state = {
      files: [],
      isLoading: false,
      isAdded: false,
      accessToken:null,
      refreshToken:null,
      title:"",
      description:""
      
      // resultConverted: {},
    }
  }

  startWithToken = async () => {
    try {
      const user_profile = JSON.parse(await AsyncStorage.getItem('userProfile'))
      const access_token = user_profile.access_token
      const refresh_token = user_profile.refresh_token
      this.setState({ accessToken: access_token, refreshToken: refresh_token })
    } catch (e) {
      console.log("catched startWithToken", e.message)
      this.props.appFunctions.redirect({ accessToken: null, refreshToken: null, isStudent: null })
    }
  }
  componentDidMount(){
    this.startWithToken()
  }

  bytesToSize(bytes) {
    var sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
    if (bytes == 0) return '0 Б';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  }

  ChooseFile = async () => {
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


      if (Platform.OS == "web") {
        this.setState({ isAdded: false })
        this.setState({ files: this.state.files.concat(file) })
      } else {
        var fileLoc = file.uri

        FileSystem.readAsStringAsync(fileLoc, {encoding:"base64"})
            .then(raw=>{
              var uriFile = "data:application/vnd.custom-type;base64," + raw
                
              file.uri = uriFile

              this.setState({ isAdded: false})
              this.setState({ files: this.state.files.concat(file) })
            })
            .catch(e=>console.log("wtf error"))
      }
    }).catch((err) => {
      console.error("Ошибка", err);
    })
  }

  Save = async()=>{
    var date, time, group
    if (Platform.OS == 'android') {
      date = this.props.route.params.date
      time = this.props.route.params.time
      group = this.props.route.params.group
    } else {
      date = this.props.navigation.getParam('date', -1)
      time = this.props.navigation.getParam('time', -1)
      group = this.props.navigation.getParam('group', -1)
    }
    
    date = new Date(decodeURIComponent(date))
    time = decodeURIComponent(time)
    group = decodeURIComponent(group)
    date.setHours(time.substring(0,2),time.substring(3,5),0,0)
    
    var data = JSON.stringify({access_token:this.state.accessToken,refresh_token:this.state.refreshToken,
      date:date, group: group, title:this.state.title, description:this.state.description, methods:this.state.files, file:{}})  
      
    try {
      let response = await fetch(baseURL + "/add_task", {
        mode: "cors",
        method: 'POST',
        headers: {
          "Content-Type": 'application/vnd.custom-type'
        },
        body: data,
      });

      if (response.status == 200) {
        let result = (await response.json());
        if (Platform.OS == 'android') {
          ToastAndroid.show("добавлено", ToastAndroid.SHORT)
          }else{
            alert("добавлено")
          }
        this.props.navigation.goBack()
      }
      else if (response.status == 401) {
        console.log("appf",this.props.appFunctions)
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
      this.setState({ isAdded: false })
      this.setState({ isLoading: false })
    }
  }

  ItemDelete = async (key) => {
    var newFiles = this.state.files.filter((_, i)=>i != key)

    this.setState({ isAdded: false, resultConverted: {} })
    this.setState({ files: newFiles })
  }

  render() {
    const { navigation } = this.props;
    const { resultConverted } = this.state;

    let inputTextBox = 
      <ThemedCard>
        <View >
          <View >
            <Text style={styles.headerText}>Название</Text>
            <TextInput
              style={styles.input}
              onChangeText={(value)=>this.setState({title: value})}
              value={this.state.title}
              placeholder="Название"
              placeholderTextColor ={theme.colors.text2}>
              </TextInput>
            <Text style={styles.headerText}>Описание задачи</Text>
            <TextInput
              style={styles.input}
              onChangeText={(value)=>this.setState({description: value})}
              value={this.state.description}
              placeholder="Описание"
              placeholderTextColor ={theme.colors.text2}
              multiline ={true}
              numberOfLines={4}>
              </TextInput>
          </View>
        </View>
      </ThemedCard>

    let inputBox =
      <ThemedCard>
        <View style={styles.inputBox}>
          <View style={styles.selectFileBox}>
            <Button
              color={theme.colors.accent}
              title="Выбрать файл"
              disabled = {!this.state.isLoading?false:true}
              onPress={() => this.ChooseFile()}
            />
          </View>
        </View>
      </ThemedCard>

    let applyBox =
      <ThemedCard>
        <View style={styles.inputBox}>
          <View>
            <Button
              color={theme.colors.accent}
              title="Сохранить"
              disabled={(this.state.title !="" & this.state.description !="") ? false : true}
              onPress={() => this.Save()}
            />
          </View>
        </View>
      </ThemedCard>

    let filesListView =
      this.state.files.map((prop, key) => {
        return (
        <View style={styles.listview} key={key}>
          <View style={{ flex: 1 }}><Text style={styles.listItemHeader}>{key + 1}. {prop.name} ({this.bytesToSize(prop.size)})</Text></View>
          <View style={styles.listItemButton}><Button disabled = {!this.state.isLoading?false:true} title="⛌" onPress={() => this.ItemDelete(key)} color="#dc3545"/></View>
        </View>);
      })
    
    let fileListBox = this.state.files.length == 0 ? <View /> :
      <ThemedCard>
        <View style={styles.listviewBox}>
          <Text style={styles.headerText}>Список файлов</Text>
          {filesListView}
        </View>
      </ThemedCard>
    

    

    return (
      <ScrollView style={styles.mainScroll} contentContainerStyle={{flexDirection:'row', justifyContent: 'center'}}>
        <View style={styles.container}>
          {inputTextBox}
          {inputBox}
          {fileListBox}
          {applyBox}

        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  mainScroll: {
    backgroundColor: theme.colors.background,
  },
  input:{
    margin: marginComponent,
    padding:paddingComponent,
    borderWidth: borderWidth,
    borderRadius:borderRadius,
    borderColor:theme.colors.accent,
    color: theme.colors.text,
  },
  container: {
    paddingBottom:16,
    maxWidth:700,
    flex: 1,
  },
  inputBox: {
    flexDirection: 'column', 
    alignItems: "center",
  },
  headerText: {
    fontSize: headerFontSize,
    color: theme.colors.text,
    textAlign: "center",
    fontWeight: 'bold',
    marginBottom: 12,
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 10,
    color: theme.colors.text2,
  },
  selectFileBox: {
    alignItems: "center",
    flexDirection: 'row',
  },
  listviewBox: {
    flexDirection: 'column',
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
  convertFileBox: {
    alignSelf: "center",
    flexDirection: 'row',
    marginTop: 10
  },
  downloadFileBox: {
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 10
  },
});

export default AddTaskActivity;
