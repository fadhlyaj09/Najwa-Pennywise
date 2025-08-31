
"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import NextLink from 'next/link';
import { PlusCircle, Tags, LogOut, BookUser } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";

const defaultCategories: Omit<Category, 'id' | 'isDefault'>[] = [
    { name: 'Salary', icon: 'Landmark', type: 'income' },
    { name: 'Breakfast', icon: 'Coffee', type: 'expense' },
    { name: 'Lunch', icon: 'Utensils', type: 'expense' },
    { name: 'Dinner', icon: 'UtensilsCrossed', type: 'expense' },
    { name: 'Groceries', icon: 'ShoppingCart', type: 'expense' },
    { name: 'Transport', icon: 'Car', type: 'expense' },
    { name: 'Snacks', icon: 'Cookie', type: 'expense' },
    { name: 'Monthly Shopping', icon: 'ShoppingBag', type: 'expense' },
    { name_above: 'Hangout', icon: 'Users', type: 'expense' },
    { name: 'Internet Quota', icon: 'Wifi', type: 'expense' },
];

export default function Dashboard() {
  const { logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spendingLimit, setSpendingLimit] = useState<number>(5000000);

  useEffect(() => {
    // Load transactions
    const storedTransactions = localStorage.getItem("pennywise_transactions");
    if (storedTransactions) {
      try {
        setTransactions(JSON.parse(storedTransactions));
      } catch (e) {
        console.error("Failed to parse transactions from localStorage", e);
        setTransactions([]);
      }
    }
    
    // Load categories
    const initialDefaultCategories: Category[] = defaultCategories.map(cat => ({
        ...cat,
        id: `default-${cat.name.toLowerCase().replace(/\s+/g, '-')}`,
        isDefault: true,
    }));
    
    const storedCategoriesString = localStorage.getItem("pennywise_categories");
    const userCategories: Category[] = storedCategoriesString 
        ? JSON.parse(storedCategoriesString)
        : [];

    setCategories([...initialDefaultCategories, ...userCategories]);


    // Load spending limit
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
    localStorage.setItem("pennywise_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    const userDefinedCategories = categories.filter(c => !c.isDefault);
    localStorage.setItem("pennywise_categories", JSON.stringify(userDefinedCategories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("pennywise_limit", JSON.stringify(spendingLimit));
  }, [spendingLimit]);

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const categoryExists = categories.some(c => c.name.toLowerCase() === transaction.category.toLowerCase() && c.type === transaction.type);
    if (!categoryExists) {
        addCategory({ name: transaction.category, icon: 'Tag', type: transaction.type });
    }
    const newTransaction = { ...transaction, id: crypto.randomUUID() };
    setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const addCategory = (category: Omit<Category, "id" | 'isDefault'>) => {
    const existingCategory = categories.find(c => c.name.toLowerCase() === category.name.toLowerCase() && c.type === category.type);
    if (existingCategory) {
       return; 
    }
    const newCategory: Category = { ...category, id: crypto.randomUUID(), isDefault: false };
    setCategories(prev => [...prev, newCategory]);
  };
  
  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
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

  const incomeCategories = useMemo(() => {
      return categories
          .filter(c => c.type === 'income')
          .sort((a,b) => a.name.localeCompare(b.name));
  }, [categories]);

  const expenseCategories = useMemo(() => {
    return categories
      .filter(c => c.type === 'expense')
      .sort((a,b) => a.name.localeCompare(b.name));
  }, [categories]);


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <NextLink href="/" passHref>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text cursor-pointer">Najwa Pennywise</h1>
          </NextLink>
          <div className="flex items-center gap-2">
            <NextLink href="/debt" passHref>
               <Button variant="ghost" size="icon" aria-label="Manage Debt">
                  <BookUser className="h-5 w-5" />
                </Button>
            </NextLink>

            <Sheet open={categoryManagerOpen} onOpenChange={setCategoryManagerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Manage Categories">
                  <Tags className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Manage Categories</SheetTitle>
                </SheetHeader>
                <CategoryManager 
                  categories={categories} 
                  onAddCategory={addCategory} 
                  onDeleteCategory={deleteCategory} 
                />
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

            <Button variant="ghost" size="icon" aria-label="Logout" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container py-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-1 flex flex-col gap-6">
             <SummaryCards 
              income={income}
              expenses={expenses}
              balance={balance}
              spendingLimit={spendingLimit}
              onSetSpendingLimit={setSpendingLimit}
            />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6">
            <TransactionHistory transactions={transactions} />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6">
            <WeeklyChart transactions={transactions} />
            <AiReport transactions={transactions} spendingLimit={spendingLimit} income={income} expenses={expenses} />
          </div>
        </div>
      </main>
    </div>
  );
}
