import { View, Text, StyleSheet, Platform, Animated } from "react-native";
import React, { useState, useCallback, useEffect } from 'react';
import { GiftedChat, Bubble, Send, Actions,Composer,ComposerProps,SendProps, InputToolbar } from 'react-native-gifted-chat';
//import Ionicons from 'react-native-vector-icons/Ionicons'
import 'dayjs/locale/ru'
import SplashActivity from "../SplashActivity"
import WSController from './Socket'
import AsyncStorage from '@react-native-async-storage/async-storage';

import { baseURL, theme } from '../constants'
import { isNullishCoalesce } from "typescript";

import ThemedCard from "../components/ThemedCard"

import { MaterialCommunityIcons } from '@expo/vector-icons';


function renderBubble(props) {
  return (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: theme.colors.accent
        }
      }}
    />
  )
}

function renderSend(props) {
  return (
      <Send
        {...props}
        containerStyle={{
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'center',
          marginRight: 15
        }}>
        <MaterialCommunityIcons name='send' size={20} color={theme.colors.accent} />
      </Send>
  );
}

function renderComposer(props)
{ return(
  <Composer
    {...props}
    textInputProps={{
      ...props.textInputProps,
      // for enabling the Return key to send a message only on web
      blurOnSubmit: Platform.OS === 'web',
      onSubmitEditing:
        Platform.OS === 'web'
          ? () => {
              if (props.text && props.onSend) {
                props.onSend({text: props.text.trim()}, true);
              }
            }
          : undefined,
    }}
  />
);}

function renderInputToolbar (props) {
  //Add the extra styles via containerStyle
 return <InputToolbar 
    {...props}
    textInputProps={{
      ...props.textInputProps,
      // for enabling the Return key to send a message only on web
      blurOnSubmit: true,
      onSubmitEditing:
        Platform.OS === 'web'
          ? () => {
              if (props.text && props.onSend) {
                props.onSend({text: props.text.trim()}, true);
              }
            }
          : undefined,
    }}
    placeholder='Введите сообщение'
    onSubmitEditing={
      ()=>{console.log("onSubmitEditing")}
    }
    textInputStyle={{ color: theme.colors.text }}
    containerStyle={{
      backgroundColor: theme.colors.background,
    }} />
}

// function handlePickImage(){
//   try {
//     let attachedImage
//     if (imageSource.uri.length > 0) {
//       attachedImage = new ReactNativeFile({
//         uri: imageSource.uri,
//         name: 'messageImage.jpg',
//         type: 'image/jpeg',
//       })
// }}catch(err){
//   console.log(err)
// }
// }

// function renderActions(props) {
//   return (
//     <Actions
//       {...props}
//       options={{
//         ['отправить фото']: handlePickImage,
//       }}
//       icon={() => (
//         <Ionicons name='add' size={25} color={'black'} />
//       )}

//       onSend={args => console.log(args)}
//     />
//   )
// }


export default function ChatActivity(props) {

  const [messages, setMessages] = useState([])
  const [token, setToken] = useState({ accessToken: null, refreshToken: null })
  const [ids, setIds] = useState({ roomId: -1, myId: -1 })


  if (Platform.OS == 'android') {
    if (ids.roomId == -1) {
      let roomId = props.route.params.room_id
      let myId = props.route.params.my_id
      setIds({ roomId: roomId, myId: myId })
    }
  } else {
    if (ids.roomId == -1) {

      let roomId = props.navigation.getParam('room_id', -1)
      let myId = props.navigation.getParam('my_id', -1)
      setIds({ roomId: roomId, myId: myId })
    }
  }

  const startWithToken = async () => {
    try {
      const user_profile = JSON.parse(await AsyncStorage.getItem('userProfile'))
      const access_token = user_profile.access_token
      const refresh_token = user_profile.refresh_token
      const is_student = user_profile.is_student
      setToken({ accessToken: access_token, refreshToken: refresh_token })

    } catch (e) {
    }
  }

  useEffect(() => {
    startWithToken()
  }, [])

  useEffect(async () => {
    if (token.accessToken == null) {
      return
    }
    //console.log("roomid and myId in room", ids.roomId, ids.myId)
    const data = { access_token_cookie: token.accessToken, refresh_token_cookie: token.accessToken, roomId: ids.roomId }

    var response
    try {
      response = await fetch(baseURL + "/chat/room", {
        mode: "cors",
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        }
      })
    } catch (err) {

      console.log("no connection for room in useEffect", err)
      return
    }
    if (response.status == 200) {
      try {
        const result = await response.json()
        //console.log("result in room", result)
        if (result[0]){
          //setMessages(RoomsMessage.messages)/////////////
          setMessages(result[0].messages)
        }
        else
          console.log("empty messages array in room")


      } catch (err) {
        console.log("chat error", err)
      }
      //setConnection(true)
    } else
      if (response.status == 400) {
        props.appFunctions.tryRefreshToken(startWithToken)
      } else console.error('response status in room', response.status)

  }, [token])


  useEffect(() => {
    let controller = new WSController()
    var ws = controller.ws;

    if(token.accessToken == null) return
    ws.onopen = () => {
      console.log("socket is open", token.accessToken? "tokens exists":"tokens not exist")
      ws.send(JSON.stringify({
        ms_type: 1,
        access_token_cookie: token.accessToken,
        refresh_token_cookie: token.refreshToken,
        myId: ids.myId, roomId: ids.roomId
      }));
    };
  },[token])

  useEffect(() => {
    let controller = new WSController()
    var ws = controller.ws;

    ws.onmessage = (response) => {
      var message = JSON.parse(response.data)
      setMessages(previousMessages => GiftedChat.prepend(previousMessages, message))
    };

    ws.onerror = (e) => {
      //setConnection(false)
      console.log('socket eroor', e.message);
    };

    ws.onclose = (e) => {
      controller.nullify()
      console.log('socket close', e.code, e.reason);
    };

    return function cleanup() {
      ws.close(4000, "left from chat")
      //controller.nullify()
    };
  }, [])


  const onSend = useCallback((messages = []) => {
    let controller = new WSController()
    var ws = controller.ws;
    //console.log(messages)
    //if(ws.readyState == 1){
      // var result = {access_token_cookie: token.accessToken,
      //   refresh_token_cookie: token.refreshToken,
      //   myId: ids.myId, roomId: ids.roomId, messages:messages[0]}
      var result={ms_type: 2, messages: messages[0]}
      if(ws.readyState == 1)
        ws.send(JSON.stringify(result))
      else console.log("bad state websocket")
      //console.log(JSON.stringify(messages[0]))
      //ws.send(JSON.stringify(messages[0]))
    //}else console.log("need reconection")
  }, [])


  return (
    <View style={styles.mainBox} contentContainerStyle={{flexDirection:'row', justifyContent: 'center'}}>
      <ThemedCard style={styles.container}>
        <GiftedChat
          messages={messages}
          onSend={messages => onSend(messages)}
          locale='ru'
          renderBubble={renderBubble}
          renderSend={renderSend}
          renderInputToolbar={renderInputToolbar} 
          inverted={false}
          //renderActions={renderActions}
          user={{
            _id: ids.myId,//id влдельца
          }}
        />
      </ThemedCard>
    </View>

  );

}

const styles = StyleSheet.create({
  mainBox: {
    flex:1,
    backgroundColor: theme.colors.background,
    flexDirection:'row', 
    justifyContent: 'center',
  },
  container: {
    flex:1,
    maxWidth: 700,
    ...Platform.select({
      android: {
        margin: 0,
        padding: 0,
        backgroundColor: theme.colors.background,
      },
    }),
  },
})
