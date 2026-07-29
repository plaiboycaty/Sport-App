import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AuthDividerProps {
    text?: string;
}

export const AuthDivider: React.FC<AuthDividerProps> = ({ text = 'Hoặc tiếp tục với' }) => {
    return (
        <View style={styles.container}>
            <View style={styles.line} />
            <Text style={styles.text}>{text}</Text>
            <View style={styles.line} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
        width: '100%',
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    text: {
        marginHorizontal: 12,
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '400',
    },
});