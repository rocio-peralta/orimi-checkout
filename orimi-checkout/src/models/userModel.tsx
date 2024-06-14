export interface UserData {
  id: string
  firstName: string
  lastName: string
  phonePrefix?: string
  phone: string
  email: string
  password: string
  confirmPassword: string

}

export type UserPrimaryData = Pick<
  UserData,
  'id' | 'firstName' | 'lastName' | 'phonePrefix' | 'phone' | 'email'
>
