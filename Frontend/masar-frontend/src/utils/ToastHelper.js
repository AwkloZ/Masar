import Toast from 'react-native-toast-message';

export const showSuccess = (title, message) => {
    Toast.show({
        type: 'success',
        text1: title || 'Success! 🏆',
        text2: message,
        visibilityTime: 2500,
        autoHide: true,
        topOffset: 60,
    });
};

export const showError = (title, message) => {
    Toast.show({
        type: 'error',
        text1: title || 'Hold up! 🚨',
        text2: message || 'Something went wrong.',
        visibilityTime: 3500, 
        autoHide: true,
        topOffset: 60,
    });
};
export const showInfo = (title, message) => {
    Toast.show({
        type: 'info',
        text1: title || 'Notice ✨',
        text2: message,
        visibilityTime: 2500,
        autoHide: true,
        topOffset: 60,
    });
};