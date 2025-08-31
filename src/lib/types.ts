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
  isDefault?: boolean;
}

export interface Debt {
  id: string;
  debtorName: string;
  amount: number;
  description: string;
  dueDate: string;
  status: 'paid' | 'unpaid';
}
