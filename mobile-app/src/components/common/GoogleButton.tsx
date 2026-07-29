import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GoogleButtonProps {
    onPress: () => void;
    loading?: boolean;
    text?: string;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({
    onPress,
    loading = false,
    text = 'Google',
}) => {
    return (
        <TouchableOpacity
            style={styles.button}
            onPress={onPress}
            disabled={loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color="#374151" size="small" />
            ) : (
                <View style={styles.content}>
                    <Ionicons name="logo-google" size={18} color="#EA4335" style={styles.icon} />
                    <Text style={styles.text}>{text}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: '100%',
        height: 48,
        backgroundColor: '#FAF9F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 8,
    },
    text: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
});