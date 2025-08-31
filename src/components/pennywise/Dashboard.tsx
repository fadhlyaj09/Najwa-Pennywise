"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import { PlusCircle, Tags, LogOut } from "lucide-react";
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
];

export default function Dashboard() {
  const { logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spendingLimit, setSpendingLimit] = useState<number>(5000000);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

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
    
    // Add default categories first, ensuring they have a type
    defaultCategories.forEach((defaultCat, index) => {
        const id = `default-${index}`;
        categoryMap.set(defaultCat.name.toLowerCase(), { ...defaultCat, id, isDefault: true });
    });
    
    // Then, add user-stored categories, ensuring they have a type
    storedCategories.forEach(cat => {
        const isDefault = defaultCategories.some(dc => dc.name.toLowerCase() === cat.name.toLowerCase());
        const type = cat.type || 'expense'; 
        categoryMap.set(cat.name.toLowerCase(), { ...cat, type, isDefault });
    });
    
    setCategories(Array.from(categoryMap.values()));


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
  }, [isClient]);

  useEffect(() => {
    if(isClient) {
      localStorage.setItem("pennywise_transactions", JSON.stringify(transactions));
    }
  }, [transactions, isClient]);

  useEffect(() => {
    if(isClient) {
      const userDefinedCategories = categories.filter(c => !c.isDefault);
      localStorage.setItem("pennywise_categories", JSON.stringify(userDefinedCategories));
    }
  }, [categories, isClient]);

  useEffect(() => {
    if(isClient) {
      localStorage.setItem("pennywise_limit", JSON.stringify(spendingLimit));
    }
  }, [spendingLimit, isClient]);

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const categoryExists = categories.some(c => c.name.toLowerCase() === transaction.category.toLowerCase() && c.type === transaction.type);
    if (!categoryExists) {
        addCategory({ name: transaction.category, icon: 'Tag', type: transaction.type });
    }
    const newTransaction = { ...transaction, id: crypto.randomUUID() };
    setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const addCategory = (category: Omit<Category, "id" | 'isDefault'>) => {
    const existingCategory = categories.find(c => c.name.toLowerCase() === category.name.toLowerCase());
    if (existingCategory) {
       return; 
    }
    const newCategory: Category = { ...category, id: crypto.randomUUID(), isDefault: false };
    setCategories(prev => [...prev, newCategory]);
  };
  
  const deleteCategory = (id: string) => {
    const catToDelete = categories.find(c => c.id === id);
    if (catToDelete?.isDefault) return; // Prevent deleting default categories
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
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text">Najwa Pennywise</h1>
          <div className="flex items-center gap-2">
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
          <div className="lg:col-span-2 space-y-6">
             <SummaryCards 
              income={income}
              expenses={expenses}
              balance={balance}
              spendingLimit={spendingLimit}
              onSetSpendingLimit={setSpendingLimit}
            />
            <TransactionHistory transactions={transactions} />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <WeeklyChart transactions={transactions} />
            <AiReport transactions={transactions} spendingLimit={spendingLimit} income={income} expenses={expenses} />
          </div>
        </div>
      </main>
    </div>
  );
}
