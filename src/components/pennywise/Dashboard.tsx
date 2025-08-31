
"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import NextLink from 'next/link';
import { PlusCircle, Tags, LogOut, BookUser, MoreVertical } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const defaultCategories: Omit<Category, 'id' | 'isDefault'>[] = [
    { name: 'Salary', icon: 'Landmark', type: 'income' },
    { name: 'Breakfast', icon: 'Coffee', type: 'expense' },
    { name: 'Lunch', icon: 'Utensils', type: 'expense' },
    { name: 'Dinner', icon: 'UtensilsCrossed', type: 'expense' },
    { name: 'Groceries', icon: 'ShoppingCart', type: 'expense' },
    { name: 'Transport', icon: 'Car', type: 'expense' },
    { name: 'Snacks', icon: 'Cookie', type: 'expense' },
    { name: 'Monthly Shopping', icon: 'ShoppingBag', type: 'expense' },
    { name: 'Hangout', icon: 'Users', type: 'expense' },
    { name: 'Internet Quota', icon: 'Wifi', type: 'expense' },
];

export default function Dashboard() {
  const { logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spendingLimit, setSpendingLimit] = useState<number>(5000000);

  useEffect(() => {
    const storedTransactions = localStorage.getItem("pennywise_transactions");
    if (storedTransactions) {
      try {
        setTransactions(JSON.parse(storedTransactions));
      } catch (e) {
        console.error("Failed to parse transactions from localStorage", e);
        setTransactions([]);
      }
    }
    
    const initialDefaultCategories: Category[] = defaultCategories.map(cat => ({
        ...cat,
        id: `default-${cat.name.toLowerCase().replace(/\s+/g, '-')}`,
        isDefault: true,
    }));
    
    let userCategories: Category[] = [];
    try {
        const storedCategoriesString = localStorage.getItem("pennywise_categories");
        if (storedCategoriesString) {
            userCategories = JSON.parse(storedCategoriesString).map((cat: Omit<Category, 'isDefault'>) => ({ ...cat, isDefault: false }));
        }
    } catch(e) {
        console.error("Failed to parse categories from localStorage", e);
        userCategories = [];
    }

    const allCategories = [...initialDefaultCategories];
    const userCategoryMap = new Map(userCategories.map(cat => [cat.id, cat]));
    
    allCategories.forEach(defaultCat => {
        const potentialUserCat = userCategories.find(userCat => userCat.name.toLowerCase() === defaultCat.name.toLowerCase() && userCat.type === defaultCat.type);
        if(potentialUserCat) {
            userCategoryMap.delete(potentialUserCat.id);
        }
    });

    setCategories([...initialDefaultCategories, ...Array.from(userCategoryMap.values())]);


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
    const categoryToDelete = categories.find(c => c.id === id);
    if (!categoryToDelete || categoryToDelete.isDefault) return;

    const isCategoryInUse = transactions.some(t => t.category.toLowerCase() === categoryToDelete.name.toLowerCase());
    
    if (isCategoryInUse) {
        alert(`Cannot delete category "${categoryToDelete.name}" because it is currently in use by one or more transactions.`);
        return;
    }

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
            <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text cursor-pointer">
              Najwa<span className="hidden sm:inline"> Pennywise</span>
            </h1>
          </NextLink>
          <div className="flex items-center gap-2">
            
            <Dialog open={transactionFormOpen} onOpenChange={setTransactionFormOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="relative">
                  <PlusCircle className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline">Add Transaction</span>
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

            <div className="hidden md:flex items-center gap-2">
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
              
              <Button variant="ghost" size="icon" aria-label="Logout" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>

            <div className="md:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <DropdownMenuItem onSelect={() => router.push('/debt')}>
                            <BookUser className="mr-2 h-4 w-4" />
                            <span>Manage Debt</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setCategoryManagerOpen(true)}>
                            <Tags className="mr-2 h-4 w-4" />
                            <span>Manage Categories</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
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

    

    