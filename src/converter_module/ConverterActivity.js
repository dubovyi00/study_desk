import React from "react";
import { 
  View, Text, StyleSheet, Button, Platform, ScrollView, 
  Linking,  FlatList, SafeAreaView, StatusBar, 
} from "react-native";

import {
  baseURL, theme
} from '../constants'

import ThemedCard from "../components/ThemedCard"

import { getDocumentAsync } from "expo-document-picker"
import * as FileSystem from 'expo-file-system';

class ConverterActivity extends React.Component {
  constructor(props) {
    super(props);
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    this.state = {
      files: [],
      isLoading: false,
      isConverted: false,
      resultConverted: {},
    }
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
        this.setState({ isConverted: false, resultConverted: {} })
        this.setState({ files: this.state.files.concat(file) })
      } else {
        var fileLoc = file.uri

        FileSystem.readAsStringAsync(fileLoc, {encoding:"base64"})
            .then(raw=>{
              var uriFile = "data:application/vnd.custom-type;base64," + raw
                
              file.uri = uriFile

              this.setState({ isConverted: false, resultConverted: {} })
              this.setState({ files: this.state.files.concat(file) })
            })
            .catch(e=>console.log("wtf error"))
      }
    }).catch((err) => {
      console.error("Ошибка", err);
    })
  }

  Convert = async () => {
    if (this.state.files.length == 0)
      return

    this.setState({ isLoading: true })
    this.setState({ isConverted: false })
    this.setState({ resultConverted: {} })

    var data = JSON.stringify({data:this.state.files})
    
    try {
      let response = await fetch(baseURL + "/upload", {
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

        this.setState({ isConverted: true })
        this.setState({ resultConverted: result.data })
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
      this.setState({ isConverted: false })
      this.setState({ resultConverted: {} })
      this.setState({ isLoading: false })
    }
  }

  DownloadFile = async () => {
    const { resultConverted } = this.state;
    var url = resultConverted.path
    console.log(resultConverted)

    await Linking.openURL(url);
  }

  ItemMoveUp = async (key) => {
    if(key <= 0)
      return;
        
    var newFiles = this.state.files

    var bufFile = newFiles[key];
    newFiles[key] = newFiles[key - 1];
    newFiles[key - 1] = bufFile

    this.setState({ files: newFiles })
    this.setState({ isConverted: false, resultConverted: {} })
  }

  ItemMoveDown = async (key) => {
    if(key >= this.state.files.length-1)
      return;
        
    var newFiles = this.state.files

    var bufFile = newFiles[key];
    newFiles[key] = newFiles[key + 1];
    newFiles[key + 1] = bufFile

    this.setState({ files: newFiles })
    this.setState({ isConverted: false, resultConverted: {} })
  }

  ItemDelete = async (key) => {
    var newFiles = this.state.files.filter((_, i)=>i != key)

    this.setState({ isConverted: false, resultConverted: {} })
    this.setState({ files: newFiles })
  }

  render() {
    const { navigation } = this.props;
    const { resultConverted } = this.state;


    let inputBox = 
      <ThemedCard>
        <View style={styles.inputBox}>
          <Text style={styles.headerText}>Преобразовать в PDF</Text>
          <Text style={styles.disclaimer}>Мы не несём ответственности за конфиденциальность отправляемых файлов.</Text>
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

    let filesListView =
      this.state.files.map((prop, key) => {
        return (
        <View style={styles.listview} key={key}>
          <View style={{ flex: 1 }}><Text style={styles.listItemHeader}>{key + 1}. {prop.name} ({this.bytesToSize(prop.size)})</Text></View>
          <View style={styles.listItemButton}><Button disabled = {!this.state.isLoading?false:true} title="▲" onPress={() => this.ItemMoveUp(key)}/></View>
          <View style={styles.listItemButton}><Button disabled = {!this.state.isLoading?false:true} title="▼" onPress={() => this.ItemMoveDown(key)}/></View>
          <View style={styles.listItemButton}><Button disabled = {!this.state.isLoading?false:true} title="⛌" onPress={() => this.ItemDelete(key)} color="#dc3545"/></View>
        </View>);
      })
    
    let fileListBox = this.state.files.length == 0 ? <View /> :
      <ThemedCard>
        <View style={styles.listviewBox}>
          <Text style={styles.headerText}>Список файлов</Text>
          {filesListView}
          <View style={styles.convertFileBox}>
            <Button
              color="#c93757"
              disabled = {!this.state.isLoading?false:true}
              title = {!this.state.isLoading?"Конвертировать":"Конвертируем..."}
              onPress={() => this.Convert()}
            />
          </View>
        </View>
      </ThemedCard>
    
    let outputBox = !this.state.isConverted ? <View /> :
      <ThemedCard>
        <Text style={styles.headerText}>Результат</Text>

        <View style={styles.listview}>
          <View style={{ flex: 1 }}><Text style={styles.listItemHeader}>{resultConverted.name} ({this.bytesToSize(resultConverted.size)})</Text></View>
        </View>
        <View style={styles.downloadFileBox}>
          <Button
            color={theme.colors.accent}
            title="Скачать"
            onPress={() => this.DownloadFile(resultConverted.path)}
          />
        </View>
      </ThemedCard>
    

    return (
      <ScrollView style={styles.mainScroll} contentContainerStyle={{flexDirection:'row', justifyContent: 'center'}}>
        <View style={styles.container}>
          {inputBox}
          {fileListBox}
          {outputBox}
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
  inputBox: {
    flexDirection: 'column', 
    alignItems: "center",
  },
  headerText: {
    fontSize: 27,
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

export default ConverterActivity;
