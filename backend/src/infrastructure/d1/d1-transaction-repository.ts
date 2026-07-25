import type { CreateTransactionInput, Transaction, UpdateTransactionInput } from '../../domain/entities/transaction'
import type { TransactionRepository } from '../../domain/repositories/transaction-repository'

interface TransactionRow {
  id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string
  date: string
  created_at: string
}

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    category: row.category,
    amount: row.amount,
    description: row.description,
    date: row.date,
    createdAt: row.created_at,
  }
}

export class D1TransactionRepository implements TransactionRepository {
  constructor(private readonly db: D1Database) {}

  async findAll(): Promise<Transaction[]> {
    const { results } = await this.db
      .prepare('SELECT id, type, category, amount, description, date, created_at FROM transactions ORDER BY date DESC, created_at DESC')
      .all<TransactionRow>()
    return results.map(toTransaction)
  }

  async findByType(type: 'income' | 'expense'): Promise<Transaction[]> {
    const { results } = await this.db
      .prepare('SELECT id, type, category, amount, description, date, created_at FROM transactions WHERE type = ? ORDER BY date DESC, created_at DESC')
      .bind(type)
      .all<TransactionRow>()
    return results.map(toTransaction)
  }

  async findById(id: string): Promise<Transaction | null> {
    const row = await this.db
      .prepare('SELECT id, type, category, amount, description, date, created_at FROM transactions WHERE id = ?')
      .bind(id)
      .first<TransactionRow>()
    return row ? toTransaction(row) : null
  }

  async create(input: CreateTransactionInput): Promise<Transaction> {
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    await this.db
      .prepare('INSERT INTO transactions (id, type, category, amount, description, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, input.type, input.category, input.amount, input.description, input.date, createdAt)
      .run()
    return { id, ...input, createdAt }
  }

  async update(id: string, input: UpdateTransactionInput): Promise<Transaction | null> {
    const existing = await this.findById(id)
    if (!existing) return null

    const type = input.type ?? existing.type
    const category = input.category ?? existing.category
    const amount = input.amount ?? existing.amount
    const description = input.description ?? existing.description
    const date = input.date ?? existing.date

    await this.db
      .prepare('UPDATE transactions SET type = ?, category = ?, amount = ?, description = ?, date = ? WHERE id = ?')
      .bind(type, category, amount, description, date, id)
      .run()
    return { ...existing, type, category, amount, description, date }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM transactions WHERE id = ?').bind(id).run()
    return result.meta.changes > 0
  }
}
