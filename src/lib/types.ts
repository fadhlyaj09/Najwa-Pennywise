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
}
