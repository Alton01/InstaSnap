import * as z from "zod";


export const SignupValidation = z.object({
    name: z.string().min(2, {message: "Your name is too short"}),
    username: z.string().min(2, {message: "Your username is too short"}).max(15),
    email: z.string().email(),
    password: z.string().min(8, {message: 'Minimum of 8 characters as password.'}),
  });

  export const SigninValidation = z.object({
    email: z.string().email(),
    password: z.string().min(8, {message: 'Minimum of 8 characters as password.'}),
  });

  export const PostValidation = z.object({
    caption: z.string().min(5).max(2200),
    file: z.custom<File[]>(),
    location: z.string().min(2).max(100),
    tags: z.string(),
  });