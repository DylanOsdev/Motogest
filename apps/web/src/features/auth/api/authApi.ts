import type {
  LoginCredentials,
  LoginResponse,
  MessageResponse,
  SignupPayload,
} from '../slices/authSlice'

/**
 * Stub. Real axios-backed implementation arrives with task 4.4 once the RED
 * test in authApi.test.ts (task 4.3) drives the contract. Keeping this stub
 * lets the slice and consumers compile while we work top-down.
 */
export const authApi = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    throw new Error('authApi.login not implemented yet (task 4.4)')
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async signup(payload: SignupPayload): Promise<MessageResponse> {
    throw new Error('authApi.signup not implemented yet (task 4.4)')
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async verifyEmail(token: string): Promise<MessageResponse> {
    throw new Error('authApi.verifyEmail not implemented yet (task 4.4)')
  },
}
