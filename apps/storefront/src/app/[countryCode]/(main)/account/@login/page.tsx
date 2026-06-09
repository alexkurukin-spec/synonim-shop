import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"

export const metadata: Metadata = {
  title: "Вход",
  description: "Вход в личный кабинет СИНОНИМ.",
}

export default function Login() {
  return <LoginTemplate />
}
