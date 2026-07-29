import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AuthInputProps extends TextInputProps {
    label: string;
    iconName: keyof typeof Ionicons.glyphMap;
    isPassword?: boolean;
    error?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({
    label,
    iconName,
    isPassword = false,
    error,
    style,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

            <View style={[
                styles.inputWrapper,
                isFocused && styles.inputFocused,
                !!error && styles.inputError,
            ]}>
                <Ionicons name={iconName} size={20} color="#6B7280" style={styles.leftIcon} />

                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={isPassword && !showPassword}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoCapitalize="none"
                    {...props}
                />

                {isPassword && (
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.rightIconButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color="#6B7280"
                        />
                    </TouchableOpacity>
                )}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#374151',
        letterSpacing: 0.5,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        paddingHorizontal: 14,
        height: 52,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    inputFocused: {
        borderColor: '#0265DC',
        borderWidth: 1.5,
    },
    inputError: {
        borderColor: '#EF4444',
    },
    leftIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1F2937',
        paddingVertical: 0,
        height: '100%',
    },
    rightIconButton: {
        padding: 6,
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 4,
        marginLeft: 2,
    },
});