"use client"

import { useActionState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signup as (state: string | null, formData: FormData) => Promise<string | null>, null as string | null)

  return (
    <div
      className="max-w-sm flex flex-col items-center"
      data-testid="register-page"
    >
      <h1 className="text-large-semi uppercase mb-6">
        Регистрация в СИНОНИМ
      </h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-4">
        Создайте профиль СИНОНИМ и получите доступ ко всем возможностям.
      </p>
      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Имя"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label="Фамилия"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          <Input
            label="Email"
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            label="Телефон"
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label="Пароль"
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="register-error" />
        <span className="text-center text-ui-fg-base text-small-regular mt-6">
          Создавая аккаунт, вы соглашаетесь с{" "}
          <LocalizedClientLink
            href="/info/politika-konfidencialnosti"
            className="underline"
          >
            Политикой обработки ПДн
          </LocalizedClientLink>{" "}
          and{" "}
          <LocalizedClientLink
            href="/info/yuridicheskaya-informaciya"
            className="underline"
          >
            Юридической информацией
          </LocalizedClientLink>
          .
        </span>
        <SubmitButton className="w-full mt-6" data-testid="register-button">
          Зарегистрироваться
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Уже есть аккаунт?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline"
        >
          Войти
        </button>
        .
      </span>
    </div>
  )
}

export default Register
