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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const defaultCategories: Omit<Category, 'id'>[] = [
  { name: 'Salary', icon: 'Landmark' },
  { name: 'Breakfast', icon: 'Coffee' },
  { name: 'Lunch', icon: 'Utensils' },
  { name: 'Dinner', icon: 'UtensilsCrossed' },
  { name: 'Snacks', icon: 'Cookie' },
  { name: 'Monthly Shopping', icon: 'ShoppingBag' },
];

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spendingLimit, setSpendingLimit] = useState<number>(5000000);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedTransactions = localStorage.getItem("pennywise_transactions");
    if (storedTransactions) {
      try {
        setTransactions(JSON.parse(storedTransactions));
      } catch (e) {
        console.error("Failed to parse transactions from localStorage", e);
        setTransactions([]);
      }
    }
    
    let storedCategories: Category[] = [];
    try {
        const storedCategoriesString = localStorage.getItem("pennywise_categories");
        if(storedCategoriesString) {
            storedCategories = JSON.parse(storedCategoriesString);
        }
    } catch(e) {
        console.error("Failed to parse categories from localStorage", e);
        storedCategories = [];
    }

    const categoryMap = new Map<string, Category>();

    // Add default categories first, with unique IDs
    defaultCategories.forEach(defaultCat => {
        categoryMap.set(defaultCat.name.toLowerCase(), { ...defaultCat, id: `default-${defaultCat.name.toLowerCase()}` });
    });
    
    // Then, overwrite with stored categories to respect user's data and IDs
    storedCategories.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase(), cat);
    });
    
    setCategories(Array.from(categoryMap.values()));


    const storedLimit = localStorage.getItem("pennywise_limit");
    if (storedLimit) {
      try {
        setSpendingLimit(JSON.parse(storedLimit));
      } catch(e) {
        console.error("Failed to parse spending limit from localStorage", e);
        setSpendingLimit(5000000);
      }
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
    // Check if the category is new
    const categoryExists = categories.some(c => c.name.toLowerCase() === transaction.category.toLowerCase());
    if (!categoryExists) {
        addCategory({ name: transaction.category, icon: 'Tag' });
    }
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

  const incomeCategories = categories.filter(c => c.name === 'Salary');
  const expenseCategories = categories.filter(c => c.name !== 'Salary');


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text">Najwa Pennywise</h1>
          <div className="flex items-center gap-2">
            <Sheet open={categoryManagerOpen} onOpenChange={setCategoryManagerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Manage Categories">
                  <Tags className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Manage Categories</SheetTitle>
                </SheetHeader>
                <CategoryManager categories={categories} onAddCategory={addCategory} />
              </SheetContent>
            </Sheet>

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
                   incomeCategories={incomeCategories}
                   expenseCategories={expenseCategories}
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
