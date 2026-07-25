import type { Context } from 'hono'
import type { CreateTransactionInput, UpdateTransactionInput } from '../domain/entities/transaction'
import { ValidationError } from '../domain/errors'
import type { TransactionService } from '../services/transaction-service'

export class TransactionHandler {
  constructor(private readonly transactionService: TransactionService) {}

  list = async (c: Context) => {
    const type = c.req.query('type') as 'income' | 'expense' | undefined
    const transactions = await this.transactionService.listTransactions(type)
    return c.json({ data: transactions })
  }

  get = async (c: Context) => {
    const transaction = await this.transactionService.getTransaction(this.param(c, 'id'))
    return c.json({ data: transaction })
  }

  create = async (c: Context) => {
    const body = await this.parseJson<CreateTransactionInput>(c)
    const transaction = await this.transactionService.createTransaction(body)
    return c.json({ data: transaction }, 201)
  }

  update = async (c: Context) => {
    const body = await this.parseJson<UpdateTransactionInput>(c)
    const transaction = await this.transactionService.updateTransaction(this.param(c, 'id'), body)
    return c.json({ data: transaction })
  }

  delete = async (c: Context) => {
    await this.transactionService.deleteTransaction(this.param(c, 'id'))
    return c.body(null, 204)
  }

  private param(c: Context, name: string): string {
    const value = c.req.param(name)
    if (!value) throw new ValidationError(`${name} param is required`)
    return value
  }

  private async parseJson<T>(c: Context): Promise<T> {
    try {
      return await c.req.json<T>()
    } catch {
      throw new ValidationError('Invalid JSON body')
    }
  }
}
