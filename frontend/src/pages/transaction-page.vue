<script setup lang="ts">
import { useTransactionStore } from '@/stores/use-transaction-store'
import type { CreateTransactionBody, Transaction, UpdateTransactionBody } from '@/models'

const txStore = useTransactionStore()
const { transactions, isLoading, error, incomeList, expenseList, totalIncome, totalExpense, balance } = storeToRefs(txStore)

const headers = [
  { title: 'Date', key: 'date' },
  { title: 'Type', key: 'type' },
  { title: 'Category', key: 'category' },
  { title: 'Description', key: 'description' },
  { title: 'Amount (฿)', key: 'amount', align: 'end' as const },
  { title: 'Action', key: 'action', sortable: false, align: 'end' as const },
]

const filterType = ref<'all' | 'income' | 'expense'>('all')

const filteredTransactions = computed(() => {
  if (filterType.value === 'all') return transactions.value
  return transactions.value.filter(t => t.type === filterType.value)
})

// Dialog state
const dialog = ref(false)
const deleteDialog = ref(false)
const isSubmitting = ref(false)
const editingTx = ref<Transaction | null>(null)
const deletingTx = ref<Transaction | null>(null)

const form = ref<CreateTransactionBody & UpdateTransactionBody>({
  type: 'expense',
  category: '',
  amount: 0,
  description: '',
  date: new Date().toISOString().slice(0, 10),
})

function openCreate() {
  editingTx.value = null
  form.value = {
    type: 'expense',
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().slice(0, 10),
  }
  dialog.value = true
}

function openEdit(tx: Transaction) {
  editingTx.value = tx
  form.value = {
    type: tx.type,
    category: tx.category,
    amount: tx.amount,
    description: tx.description,
    date: tx.date,
  }
  dialog.value = true
}

function openDelete(tx: Transaction) {
  deletingTx.value = tx
  deleteDialog.value = true
}

async function submit() {
  isSubmitting.value = true
  try {
    if (editingTx.value)
      await txStore.updateTransaction(editingTx.value.id, form.value)
    else
      await txStore.createTransaction(form.value as CreateTransactionBody)
    dialog.value = false
  }
  finally {
    isSubmitting.value = false
  }
}

async function confirmDelete() {
  if (!deletingTx.value) return
  isSubmitting.value = true
  try {
    await txStore.deleteTransaction(deletingTx.value.id)
    deleteDialog.value = false
  }
  finally {
    isSubmitting.value = false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { dateStyle: 'medium' })
}

function formatCurrency(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function typeColor(type: string) {
  return type === 'income' ? 'success' : 'error'
}

function typeLabel(type: string) {
  return type === 'income' ? 'รายรับ' : 'รายจ่าย'
}

onMounted(() => txStore.fetchTransactions())
</script>

<template>
  <div>
    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol cols="12" md="4">
        <VCard color="success" variant="tonal">
          <VCardText class="d-flex flex-column">
            <span class="text-caption">รายรับรวม</span>
            <span class="text-h5 font-weight-bold">฿{{ formatCurrency(totalIncome) }}</span>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="4">
        <VCard color="error" variant="tonal">
          <VCardText class="d-flex flex-column">
            <span class="text-caption">รายจ่ายรวม</span>
            <span class="text-h5 font-weight-bold">฿{{ formatCurrency(totalExpense) }}</span>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="4">
        <VCard :color="balance >= 0 ? 'primary' : 'warning'" variant="tonal">
          <VCardText class="d-flex flex-column">
            <span class="text-caption">ยอดคงเหลือ</span>
            <span class="text-h5 font-weight-bold">฿{{ formatCurrency(balance) }}</span>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between pa-4 flex-wrap gap-2">
        <span class="text-h6">Transactions</span>
        <div class="d-flex align-center gap-2">
          <VBtnToggle v-model="filterType" variant="outlined" density="compact">
            <VBtn value="all">All</VBtn>
            <VBtn value="income" color="success">Income</VBtn>
            <VBtn value="expense" color="error">Expense</VBtn>
          </VBtnToggle>
          <VBtn
            color="primary"
            prepend-icon="ri-add-line"
            @click="openCreate"
          >
            Add
          </VBtn>
        </div>
      </VCardTitle>

      <VDivider />

      <VAlert
        v-if="error"
        type="error"
        class="ma-4"
        :text="error"
        closable
      />

      <VDataTable
        :headers="headers"
        :items="filteredTransactions"
        :loading="isLoading"
        hover
      >
        <template #item.date="{ item }">
          {{ formatDate(item.date) }}
        </template>

        <template #item.type="{ item }">
          <VChip :color="typeColor(item.type)" size="small" label>
            {{ typeLabel(item.type) }}
          </VChip>
        </template>

        <template #item.amount="{ item }">
          <span :class="item.type === 'income' ? 'text-success' : 'text-error'">
            {{ item.type === 'income' ? '+' : '-' }}฿{{ formatCurrency(item.amount) }}
          </span>
        </template>

        <template #item.action="{ item }">
          <IconBtn @click="openEdit(item)">
            <VTooltip activator="parent" location="top">Edit</VTooltip>
            <VIcon icon="ri-pencil-line" />
          </IconBtn>
          <IconBtn color="error" @click="openDelete(item)">
            <VTooltip activator="parent" location="top">Delete</VTooltip>
            <VIcon icon="ri-delete-bin-line" />
          </IconBtn>
        </template>

        <template #no-data>
          <div class="text-center py-8 text-disabled">
            No transactions yet. Click "Add" to create one.
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- Create / Edit Dialog -->
    <VDialog v-model="dialog" max-width="520" persistent>
      <VCard :title="editingTx ? 'Edit Transaction' : 'Add Transaction'">
        <VCardText>
          <VForm @submit.prevent="submit">
            <VSelect
              v-model="form.type"
              :items="[{ title: 'รายรับ', value: 'income' }, { title: 'รายจ่าย', value: 'expense' }]"
              label="Type"
              class="mb-4"
              required
            />
            <VTextField
              v-model="form.category"
              label="Category"
              prepend-inner-icon="ri-folder-line"
              class="mb-4"
              required
            />
            <VTextField
              v-model.number="form.amount"
              label="Amount (฿)"
              type="number"
              prepend-inner-icon="ri-money-baht-line"
              class="mb-4"
              min="0.01"
              step="0.01"
              required
            />
            <VTextField
              v-model="form.description"
              label="Description"
              prepend-inner-icon="ri-file-text-line"
              class="mb-4"
              required
            />
            <VTextField
              v-model="form.date"
              label="Date"
              type="date"
              prepend-inner-icon="ri-calendar-line"
              required
            />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end pa-4">
          <VBtn variant="text" @click="dialog = false">Cancel</VBtn>
          <VBtn
            color="primary"
            :loading="isSubmitting"
            @click="submit"
          >
            {{ editingTx ? 'Save' : 'Create' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Dialog -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard title="Delete Transaction">
        <VCardText>
          Are you sure you want to delete <strong>{{ deletingTx?.description }}</strong>? This action cannot be undone.
        </VCardText>
        <VCardActions class="justify-end pa-4">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn
            color="error"
            :loading="isSubmitting"
            @click="confirmDelete"
          >
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
