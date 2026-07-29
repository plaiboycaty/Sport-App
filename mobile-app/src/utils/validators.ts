import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, { message: 'Vui lòng nhập Họ và Tên của bạn.' })
    .max(50, { message: 'Họ và Tên không được vượt quá 50 ký tự.' }),
  email: z
    .string()
    .min(1, { message: 'Vui lòng nhập địa chỉ Email.' })
    .email({ message: 'Địa chỉ Email không hợp lệ.' }),
  password: z
    .string()
    .min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự.' })
    .max(100, { message: 'Mật khẩu không được quá 100 ký tự.' }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Vui lòng nhập địa chỉ Email.' })
    .email({ message: 'Địa chỉ Email không hợp lệ.' }),
  password: z
    .string()
    .min(1, { message: 'Vui lòng nhập mật khẩu.' }),
});

export type RegisterSchemaInput = z.infer<typeof registerSchema>;
export type LoginSchemaInput = z.infer<typeof loginSchema>;
