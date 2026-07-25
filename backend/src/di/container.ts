import type { CacheRepository } from '../domain/repositories/cache-repository'
import type { TransactionRepository } from '../domain/repositories/transaction-repository'
import type { UserRepository } from '../domain/repositories/user-repository'
import { TransactionHandler } from '../handlers/transaction-handler'
import { UserHandler } from '../handlers/user-handler'
import { TransactionService } from '../services/transaction-service'
import { UserService } from '../services/user-service'

export interface Repositories {
  userRepository: UserRepository
  transactionRepository: TransactionRepository
  cacheRepository: CacheRepository
}

export interface Container {
  userHandler: UserHandler
  transactionHandler: TransactionHandler
}

export function createContainer(repos: Repositories): Container {
  const userService = new UserService(repos.userRepository, repos.cacheRepository)
  const transactionService = new TransactionService(repos.transactionRepository, repos.cacheRepository)
  return {
    userHandler: new UserHandler(userService),
    transactionHandler: new TransactionHandler(transactionService),
  }
}
