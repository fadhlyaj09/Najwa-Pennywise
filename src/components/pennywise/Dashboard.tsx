"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import { PlusCircle, Tags } from "lucide-react";
import type { Transaction, Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import SummaryCards from "@/components/pennywise/SummaryCards";
import TransactionHistory from "@/components/pennywise/TransactionHistory";
import WeeklyChart from "@/components/pennywise/WeeklyChart";
import AiReport from "@/components/pennywise/AiReport";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import TransactionForm from "@/components/pennywise/TransactionForm";
import CategoryManager from "@/components/pennywise/CategoryManager";

const defaultCategories: Category[] = [
  { id: 'cat1', name: 'Salary', icon: 'Landmark' },
  { id: 'cat2', name: 'Groceries', icon: 'ShoppingCart' },
  { id: 'cat3', name: 'Rent', icon: 'Home' },
  { id: 'cat4', name: 'Transport', icon: 'Car' },
];

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [spendingLimit, setSpendingLimit] = useState<number>(5000000);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedTransactions = localStorage.getItem("pennywise_transactions");
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    }
    const storedCategories = localStorage.getItem("pennywise_categories");
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    } else {
       setCategories(defaultCategories);
    }
    const storedLimit = localStorage.getItem("pennywise_limit");
    if (storedLimit) {
      setSpendingLimit(JSON.parse(storedLimit));
    }
  }, []);

  useEffect(() => {
    if(isClient) {
      localStorage.setItem("pennywise_transactions", JSON.stringify(transactions));
    }
  }, [transactions, isClient]);

  useEffect(() => {
    if(isClient) {
      localStorage.setItem("pennywise_categories", JSON.stringify(categories));
    }
  }, [categories, isClient]);

  useEffect(() => {
    if(isClient) {
      localStorage.setItem("pennywise_limit", JSON.stringify(spendingLimit));
    }
  }, [spendingLimit, isClient]);

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction = { ...transaction, id: crypto.randomUUID() };
    setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const addCategory = (category: Omit<Category, "id">) => {
    const newCategory = { ...category, id: crypto.randomUUID() };
    setCategories(prev => [...prev, newCategory]);
  };
  
  const { income, expenses, balance } = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expenses;
    return { income, expenses, balance };
  }, [transactions]);

  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text">Pennywise</h1>
          <div className="flex items-center gap-2">
            <Dialog open={categoryManagerOpen} onOpenChange={setCategoryManagerOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Manage Categories">
                  <Tags className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manage Categories</DialogTitle>
                </DialogHeader>
                <CategoryManager categories={categories} onAddCategory={addCategory} />
              </DialogContent>
            </Dialog>

            <Dialog open={transactionFormOpen} onOpenChange={setTransactionFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                 <DialogHeader>
                   <DialogTitle>Add a new transaction</DialogTitle>
                   <DialogDescription>Enter the details of your income or expense.</DialogDescription>
                 </DialogHeader>
                 <TransactionForm
                   categories={categories}
                   onAddTransaction={(t) => {
                     addTransaction(t);
                     setTransactionFormOpen(false);
                   }}
                 />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container py-6">
        <div className="grid gap-6">
          <SummaryCards 
            income={income}
            expenses={expenses}
            balance={balance}
            spendingLimit={spendingLimit}
            onSetSpendingLimit={setSpendingLimit}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TransactionHistory transactions={transactions} />
            </div>
            <div className="space-y-6">
              <WeeklyChart transactions={transactions} />
              <AiReport transactions={transactions} spendingLimit={spendingLimit} income={income} expenses={expenses} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
