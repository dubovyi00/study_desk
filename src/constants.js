import { Dimensions } from 'react-native'
import { DarkTheme, DefaultTheme } from '@react-navigation/native';

//размеры экрана устройства
const window =Dimensions.get('window');
export const w = window.width;
export const h = window.height;


// component... для мелких фрагментов
export const componentFontSize = 16;
export const componentTitleSize = 18;
export const headerFontSize = 24;

//для правильной прокрутки ScrollView
export const paddingBottomScroll= 450;

export const marginComponent = 8;
export const paddingComponent = 6;

export const borderRadius = 3;
export const borderWidth = 1;
export const elevation = 2; ///тень

//старая тема
/*export const boxShadow = "1px 1px 1px grey"
export const borderColor = '#000';

export const textColor ='#000';
export const textExtraColor ='#383838';

export const mainColor ='#fff';
export const backgroundColor = '#dfede9';
export const navIconsColorActive = 'green';/// цвет кнопок всех
export const navIconsColorInactive = 'grey';*/


//golden color: "#C89D66"
export const DEFAULT_TEACHER_PORTRAIT = "https://sd.randgor.ru/app/teacher_placeholder.png"
export const DEFAULT_STUDENT_PORTRAIT = "https://sd.randgor.ru/app/student_placeholder.png"

export const theme = {
    ...DarkTheme,
    dark: true,
    colors: {
        ...DarkTheme.colors,
        accent: "#C89D66",
        text2: "#999999",
        background: "#222226",
        card: "#333336"
    },
}


//светлая тема
export const boxShadow = "1px 1px 1px grey"
export const borderColor = '#000';

export const textColor ='#000';
export const textExtraColor ='#383838';

export const mainColor ='#fff';
export const backgroundColor = theme.colors.background;
export const navIconsColorActive = theme.colors.accent;/// цвет кнопок всех
export const navIconsColorInactive = theme.colors.text2;




//api
//export const domainURL = "http://192.168.1.3:5000"
export const domainURL = "https://sd.randgor.ru"
export const baseURL = domainURL + "/api"