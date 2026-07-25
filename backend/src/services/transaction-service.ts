import type { CreateTransactionInput, UpdateTransactionInput } from '../domain/entities/transaction'
import { NotFoundError, ValidationError } from '../domain/errors'
import type { CacheRepository } from '../domain/repositories/cache-repository'
import type { TransactionRepository } from '../domain/repositories/transaction-repository'

const CACHE_TTL_SECONDS = 300
const cacheKey = (id: string) => `transaction:${id}`

export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly cache: CacheRepository,
  ) {}

  async listTransactions(type?: 'income' | 'expense'): Promise<ReturnType<TransactionRepository['findAll']>> {
    if (type) return this.transactionRepository.findByType(type)
    return this.transactionRepository.findAll()
  }

  async getTransaction(id: string) {
    const cached = await this.cache.get(cacheKey(id))
    if (cached) return cached

    const transaction = await this.transactionRepository.findById(id)
    if (!transaction) throw new NotFoundError('Transaction')

    await this.cache.set(cacheKey(id), transaction, CACHE_TTL_SECONDS)
    return transaction
  }

  async createTransaction(input: CreateTransactionInput) {
    this.validate(input)
    return this.transactionRepository.create(input)
  }

  async updateTransaction(id: string, input: UpdateTransactionInput) {
    if (input.type !== undefined || input.amount !== undefined || input.category !== undefined || input.date !== undefined) {
      this.validate({
        type: input.type,
        amount: input.amount,
        category: input.category,
        date: input.date,
        description: input.description ?? '',
      } as CreateTransactionInput)
    }

    const updated = await this.transactionRepository.update(id, input)
    if (!updated) throw new NotFoundError('Transaction')

    await this.cache.delete(cacheKey(id))
    return updated
  }

  async deleteTransaction(id: string): Promise<void> {
    const deleted = await this.transactionRepository.delete(id)
    if (!deleted) throw new NotFoundError('Transaction')
    await this.cache.delete(cacheKey(id))
  }

  private validate(input: CreateTransactionInput): void {
    if (!input.type || (input.type !== 'income' && input.type !== 'expense')) {
      throw new ValidationError('type must be income or expense')
    }
    if (!input.category?.trim()) throw new ValidationError('category is required')
    if (typeof input.amount !== 'number' || input.amount <= 0) {
      throw new ValidationError('amount must be a positive number')
    }
    if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
      throw new ValidationError('date must be YYYY-MM-DD format')
    }
  }
}
