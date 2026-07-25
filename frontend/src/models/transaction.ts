export interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string
  date: string
  createdAt: string
}

export interface CreateTransactionBody {
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string
  date: string
}

export interface UpdateTransactionBody {
  type?: 'income' | 'expense'
  category?: string
  amount?: number
  description?: string
  date?: string
}

export interface TransactionListResponse {
  data: Transaction[]
}

export interface TransactionResponse {
  data: Transaction
}
