import { defineStore } from 'pinia'
import { transactionApi } from '@/apis/transaction-api'
import type { CreateTransactionBody, Transaction, UpdateTransactionBody } from '@/models'

export const useTransactionStore = defineStore('TransactionStore', () => {
  const transactions = ref<Transaction[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const incomeList = computed(() => transactions.value.filter(t => t.type === 'income'))
  const expenseList = computed(() => transactions.value.filter(t => t.type === 'expense'))
  const totalIncome = computed(() => incomeList.value.reduce((sum, t) => sum + t.amount, 0))
  const totalExpense = computed(() => expenseList.value.reduce((sum, t) => sum + t.amount, 0))
  const balance = computed(() => totalIncome.value - totalExpense.value)

  async function fetchTransactions(type?: 'income' | 'expense') {
    isLoading.value = true
    error.value = null
    try {
      const res = await transactionApi.list(type)
      transactions.value = res.data
    }
    catch (e: any) {
      error.value = e.message
    }
    finally {
      isLoading.value = false
    }
  }

  async function createTransaction(body: CreateTransactionBody) {
    const res = await transactionApi.create(body)
    transactions.value.unshift(res.data)
    return res.data
  }

  async function updateTransaction(id: string, body: UpdateTransactionBody) {
    const res = await transactionApi.update(id, body)
    const idx = transactions.value.findIndex(t => t.id === id)
    if (idx !== -1) transactions.value[idx] = res.data
    return res.data
  }

  async function deleteTransaction(id: string) {
    await transactionApi.remove(id)
    transactions.value = transactions.value.filter(t => t.id !== id)
  }

  return {
    transactions, isLoading, error,
    incomeList, expenseList, totalIncome, totalExpense, balance,
    fetchTransactions, createTransaction, updateTransaction, deleteTransaction,
  }
})
