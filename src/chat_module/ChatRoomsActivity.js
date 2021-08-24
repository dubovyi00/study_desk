import { View, ScrollView, Text, StyleSheet, Platform, FlatList,Image, TouchableOpacity } from "react-native";
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';

import ThemedCard from "../components/ThemedCard"

import { MaterialCommunityIcons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  h, w,
  marginComponent,
  paddingComponent,
  componentTitleSize,
  componentFontSize,
  elevation,
  borderRadius,
  borderWidth,
  baseURL,
  boxShadow,
  DEFAULT_TEACHER_PORTRAIT,
  theme,
} from '../constants'

var bufferedChats = []
var bufferedId = -1
var _isMounted = false

export default function ChatRoomsActivity({navigation,appFunctions}) {
  const [rooms, setRooms] = useState([])
  const [myId, setMyId] = useState(bufferedId)
  const [token, setToken] = useState({ accessToken: null, refreshToken: null })
  if(Platform.OS =='android'){
    navigation = useNavigation()
  }


  const startWithToken = async () => {
    try {
      const user_profile = JSON.parse(await AsyncStorage.getItem('userProfile'))
      const access_token = user_profile.access_token
      const refresh_token = user_profile.refresh_token
      const is_student = user_profile.is_student
      _isMounted && setToken({ accessToken: access_token, refreshToken: refresh_token })
    } catch (e) {
      console.log("catched startWithToken", e.message)
      this.props.appFunctions.redirect({ accessToken: null, refreshToken: null, isStudent: null })
    }
  }

  useEffect(() => {
    _isMounted = true;
    startWithToken()
  }, [])

  useEffect(async () => {
    if(token.accessToken ==null) return
    ////////получить чаты
    const data = {
      access_token_cookie: token.accessToken,
      refresh_token_cookie: token.refreshToken
    }
    try {
      const response = await fetch(baseURL + "/chat/rooms", {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const json = await response.json()
      //console.log(json[0].rooms)
      if (response.status == 200) {
        if (json[0]) {
          bufferedChats = json[0].rooms
          bufferedId = json[0].usr_id
          _isMounted && setMyId(json[0].usr_id)
          _isMounted && setRooms(bufferedChats)
        } else {
          bufferedChats = []
          _isMounted && setRooms(bufferedChats)
          console.log("rooms array is empty")
        }
      } else{
        console.error('response status in rooms', response.status)
        appFunctions.tryRefreshToken(startWithToken)
      } 
    } catch (error) {
      _isMounted && appFunctions.tryRefreshToken(startWithToken)
      console.error('error in rooms:', error);
    }
  }, [token])
  
  useLayoutEffect(() => {
    return () => {
      _isMounted = false;
    }
  }, [])

  function openChat(room_id, user_id){
    navigation.navigate(Platform.OS == 'web'?'Chat':'chat', { room_id: room_id, my_id: user_id })
  }

  const renderItem = ({ item, key }) => {
    return (
      <ThemedCard style={styles.nopadding} key={key}>
        <TouchableOpacity style={styles.dialogBox} onPress={()=>openChat(item.room_id, bufferedId)}>
          <Image style={styles.img}
            source={{uri: item.img==null?DEFAULT_TEACHER_PORTRAIT:item.img}}
          />
          <Text
            style={styles.text}>
            {item.companionName}
          </Text>
          {item.status?
          <View style={{justifyContent:'center'}}>
            <MaterialCommunityIcons name="record-circle" size={componentTitleSize} color={theme.colors.accent} style={styles.icon} />
          </View>
          : null}   
        </TouchableOpacity>     
      </ThemedCard>
    )
  }
    
  let chatListBox = (bufferedChats.length == 0)?
    <Text style={styles.noChatsPlaceholder}>НЕТ ЧАТОВ</Text>:
    bufferedChats.map((prop, key) => {
        return (renderItem({item:prop, key:key}));
    })

  return (
    <ScrollView style={styles.mainScroll} contentContainerStyle={{flexDirection:'row', justifyContent: 'center'}}>
      <View style={styles.container}>
        {chatListBox}
      </View>
    </ScrollView>
  )
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
  dialogBox: {
    padding: 15,
    flexDirection: 'row',
    flexWrap: "wrap",
    justifyContent: "center",
    flex: 1,
  },
  noChatsPlaceholder: {
    color: theme.colors.text2,
    textAlign: 'center',
    fontSize: 20,
    margin: 16
  },
  text: {
    fontSize: componentFontSize,
    color: theme.colors.text,
    alignSelf: "center",
    flex: 1,
    margin: 4,
  },
  img: {
    width: 40,
    height: 40,
    borderRadius: 50,
    marginRight: marginComponent,
    alignItems: "center"
  },
  nopadding: {
    padding:0
  },
});