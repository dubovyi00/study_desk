import React from 'react';
import {
  TouchableHighlight,
  View,
  Text,
  StyleSheet,
  Platform
} from 'react-native';

import{w,h,
    marginComponent,
    paddingComponent,
    mainColor,
    borderRadius,
    borderWidth,
    borderColor,
    textColor,
    backgroundColor,
    elevation,
    boxShadow,
    theme
    } from '../../constants'


    const DayIcon = props =>
    {
        const {date, isChosen} = props;
        var today= new Date();
        today.setHours(0,0,0,0);
        var flag = 0;
        if((date.getDate() == today.getDate()) &&  (date.getMonth() == today.getMonth())) flag = 1; 
        var dayName;
        switch (date.getDay()) {
            case 1:
                {
                    dayName = 'Пн'
                    break;
                }
            case 2:
                {
                    dayName = 'Вт'
                    break;
                }
            case 3:
                {
                    dayName = 'Ср'
                    break;
                }
            case 4:
                {
                    dayName = 'Чт'
                    break;
                }
            case 5:
                {
                    dayName = 'Пт'
                    break;
                }
            case 6:
                {
                    dayName = 'Сб'
                    break;
                }
        }
        const { viewStyle, chosenStyle,textStyle } = styles;
        return (
            isChosen ?
                (<TouchableHighlight underlayColor={backgroundColor}>
                    <View style={[viewStyle, chosenStyle]}>
                        <Text style={textStyle}>{dayName}</Text>
                        <Text style={textStyle}>{date.getDate()}</Text>
                    </View>
                </TouchableHighlight>)
                :
                (<TouchableHighlight onPress={() => {props.onPress(date)}} underlayColor={backgroundColor}>
                    <View style={flag? [viewStyle,{borderWidth:borderWidth, borderColor: theme.colors.accent}] :[viewStyle,{borderWidth:borderWidth, borderColor: "#00000000"}]}>
                        <Text style={textStyle}>{dayName}</Text>
                        <Text style={textStyle}>{date.getDate()}</Text>
                    </View>
                </TouchableHighlight>)
                        
        );
    };

    const styles = StyleSheet.create({
        viewStyle:
        {
            width: (w-12*marginComponent)/6,
            margin: marginComponent,
            borderRadius: borderRadius,
            alignItems: 'center',
            padding:(w-12*marginComponent)/6>=38? paddingComponent : 2,
            backgroundColor: theme.colors.text2,
            ...Platform.select({
                android: {
                    elevation: elevation
                },
                default: {
                    boxShadow: boxShadow
                }
              })
        },
        chosenStyle:
        {
            backgroundColor: theme.colors.accent
        },
        textStyle:
        {
            color:textColor
        }
    });
//,
    export { DayIcon }