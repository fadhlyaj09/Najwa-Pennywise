
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense';
  isFixed?: boolean; // isFixed categories cannot be deleted
}

export interface Debt {
  id: string;
  debtorName: string;
  amount: number;
  description: string;
  dueDate: string;
  status: 'paid' | 'unpaid';
  icon: string;
  lendingTransactionId?: string; // The ID of the expense transaction created when lending money
  repaymentTransactionId?: string; // The ID of the income transaction created when debt is paid
}
