export interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string
  date: string
  createdAt: string
}

export interface CreateTransactionInput {
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string
  date: string
}

export interface UpdateTransactionInput {
  type?: 'income' | 'expense'
  category?: string
  amount?: number
  description?: string
  date?: string
}
