import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TextInput, Button, Alert } from "react-native";

import {
  baseURL,
  borderRadius,
  borderWidth,
  textColor,
  theme,DEFAULT_STUDENT_PORTRAIT
} from '../constants'

import AsyncStorage from '@react-native-async-storage/async-storage';



function echo (message) {
  alert(message)
}

class AuthActivity extends React.Component {
  state = {
    email: '', password: '', buttonActive: true
  }

  onPressLogin =async(state) =>{
      if(!state.buttonActive)
          return;


      if (state.email.length == 0) {
        echo ("Пустой email")
        return;
      }
      if (state.password.length == 0) {
        echo ("Пустой пароль")
        return;
      }
      if (/\S+@\S+.\S+/.test(state.email) == 0) {
        echo ("Неверный email")
        return;
      }

      this._isMounted && this.setState({buttonActive:false})
    
      const data = {username:state.email,password:state.password}
      try {
        let response = await fetch(baseURL+"/login",{
          mode: "cors",
          method:"POST",
          body: JSON.stringify({data}),
          headers:{
            "Content-Type": "application/json",
          }
        })
        console.log(response.ok)
        if(response.ok){
          //redirect
          let result = this._isMounted && await response.json()

          try {
            this._isMounted && await AsyncStorage.setItem('userProfile', JSON.stringify({access_token:result.access_token, refresh_token:result.refresh_token, is_student:result.is_student}))

            this.props.appFunctions.redirect({accessToken:result.access_token, refreshToken:result.refresh_token, isStudent:result.is_student})
          } catch (e) {
            // saving error
          }
          
        }
        else{
          let result = await response.json()
          echo(result.message)
        }
      } catch (e) {
        console.log("catch: ",e.message)
        echo(e.message)  
      }
      this._isMounted && this.setState({buttonActive:true})
    }

  
  componentDidMount(){
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { navigation, route } = this.props;
    const image = { uri: "https://sd.randgor.ru/app/logo_round.png" };
    return (
      <View style={styles.container}>
        <Image style={styles.img}
        source={image}
        />
        <Text style={styles.header}>
          Авторизация
        </Text>
        <TextInput
          type = "email"
          name = {"email"}
          style = {styles.input}
          onChangeText = {email => this.setState({email:email})}
          value = {this.state.email}
          placeholder = {"E-mail"}
          placeholderTextColor ={theme.colors.text2}
        />
        <TextInput
          type = "password"
          name = "password"
          style = {styles.input}
          onChangeText = {password => this.setState({password:password})}
          value = {this.state.password}
          placeholder = "Пароль"
          placeholderTextColor ={theme.colors.text2}
          onSubmitEditing = {()=> this.onPressLogin(this.state) }
          secureTextEntry
        />
        <View style={styles.buttoncase}>
          <Button
            color = {theme.colors.accent}
            disabled = {this.state.buttonActive?false:true}
            title = {this.state.buttonActive?"Войти":"Вход..."}
            onPress = {()=> this.onPressLogin(this.state) }
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  img: {
    width:100,
    height:100,
    margin:16
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  input: {
    height: 40,
    width: 270,
    marginBottom: 16,
    paddingLeft: 16,
    borderRadius: borderRadius,
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
  },
  buttoncase: {
    width: 100,
    marginBottom:150
  },
  header: { 
    fontSize: 20,
    marginBottom: 24,
    color: theme.colors.text
  }
});

export default AuthActivity;