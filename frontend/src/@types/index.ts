import type { loginSchema } from "@/schemas/login.schemas";
import type React from "react";
import type z from "zod";

export type LoginFormValues = z.infer<typeof loginSchema>;

export type Role = 'SUPERADMIN' | 'ADMIN' | 'TECH' 

export type MenuItem = {
  id: string,
  label: string,
  icon: React.ReactNode
  roles?: Role[] 
  submenu?: MenuItem[]
}