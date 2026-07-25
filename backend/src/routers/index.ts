import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { createTransactionRouter } from './transaction-router'
import { createUserRouter } from './user-router'

export function createApiRouter() {
  const api = new Hono<AppEnv>()

  api.route('/users', createUserRouter())
  api.route('/transactions', createTransactionRouter())

  return api
}
