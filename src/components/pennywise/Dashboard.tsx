
"use client";

import { useState, useEffect, useMemo } from "react";
import NextLink from 'next/link';
import { useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";

const initialCategoriesData: Omit<Category, 'id'>[] = [
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

const successMessages = [
    "Transaksi berhasil, cantik! Hebat banget ngatur keuangannya!",
    "Tercatat! Kamu memang paling bisa diandalkan, cantik.",
    "Luar biasa, cantik! Satu langkah lagi menuju tujuan finansialmu.",
    "Mantap, cantik! Pengeluaran terkontrol, masa depan cerah.",
    "Dicatat, cantik! Setiap rupiah berharga, dan kamu memahaminya.",
    "Keren, cantik! Terus disiplin seperti ini ya.",
];

export default function Dashboard() {
  const { logout } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spendingLimit, setSpendingLimit] = useState<number>(5000000);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

   useEffect(() => {
    if (typeof window !== 'undefined') {
      let storedCategories: Category[] = [];
      try {
        const storedCategoriesJson = localStorage.getItem("pennywise_categories");
        if (storedCategoriesJson) {
          storedCategories = JSON.parse(storedCategoriesJson);
        }
      } catch (e) {
        console.error("Failed to parse categories:", e);
      }
      
      if (storedCategories.length === 0) {
        const newInitialCategories = initialCategoriesData.map(cat => ({ ...cat, id: crypto.randomUUID() }));
        setCategories(newInitialCategories);
        localStorage.setItem("pennywise_categories", JSON.stringify(newInitialCategories));
      } else {
        setCategories(storedCategories);
      }

      const storedTransactions = localStorage.getItem("pennywise_transactions");
      if (storedTransactions) {
        try {
          setTransactions(JSON.parse(storedTransactions));
        } catch (e) {
          console.error("Failed to parse transactions:", e);
          setTransactions([]);
        }
      }
      
      const storedLimit = localStorage.getItem("pennywise_limit");
      if (storedLimit) {
        setSpendingLimit(JSON.parse(storedLimit));
      }
      
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
        localStorage.setItem("pennywise_transactions", JSON.stringify(transactions));
        localStorage.setItem("pennywise_categories", JSON.stringify(categories));
        localStorage.setItem("pennywise_limit", JSON.stringify(spendingLimit));
    }
  }, [transactions, categories, spendingLimit, isLoaded]);

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const categoryExists = categories.some(c => c.name.toLowerCase() === transaction.category.toLowerCase() && c.type === transaction.type);
    if (!categoryExists) {
        addCategory({ name: transaction.category, icon: 'Tag', type: transaction.type });
    }
    const newTransaction = { ...transaction, id: crypto.randomUUID() };
    setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setTransactionFormOpen(false);
    
    const randomMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
    toast({
      title: "Success!",
      description: randomMessage,
    });
  };
  
  const addCategory = (category: Omit<Category, "id">) => {
    setCategories(prev => {
        const existingCategory = prev.find(c => c.name.toLowerCase() === category.name.toLowerCase() && c.type === category.type);
        if (existingCategory) {
           toast({
             variant: 'destructive',
             title: 'Category exists',
             description: `Category "${category.name}" for ${category.type} already exists.`
           });
           return prev; 
        }
        const newCategory: Category = { ...category, id: crypto.randomUUID() };
        return [...prev, newCategory];
    });
  };
  
  const deleteCategory = (id: string) => {
    const categoryToDelete = categories.find(c => c.id === id);
    if (!categoryToDelete) return;

    const isCategoryInUse = transactions.some(t => t.category.toLowerCase() === categoryToDelete.name.toLowerCase() && t.type === categoryToDelete.type);
    
    if (isCategoryInUse) {
        toast({
            variant: "destructive",
            title: "Cannot delete category",
            description: `"${categoryToDelete.name}" is in use by one or more transactions.`
        });
        return;
    }

    setCategories(prev => prev.filter(c => c.id !== id));
    toast({
      title: 'Success!',
      description: `Category "${categoryToDelete.name}" has been deleted.`
    });
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
        <div className="w-full max-w-5xl mx-auto flex h-16 items-center justify-between px-4">
          <NextLink href="/" passHref>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text cursor-pointer pl-2 md:pl-0">
              <span className="md:hidden">Najwa</span>
              <span className="hidden md:inline">Najwa Pennywise</span>
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
                   onAddTransaction={addTransaction}
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
      
      <main className="flex-1 w-full max-w-5xl mx-auto p-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-3">
                <SummaryCards 
                income={income}
                expenses={expenses}
                balance={balance}
                spendingLimit={spendingLimit}
                onSetSpendingLimit={setSpendingLimit}
                />
            </div>
          <div className="md:col-span-2 lg:col-span-1 flex flex-col gap-6">
            <TransactionHistory transactions={transactions} />
          </div>
          <div className="md:col-span-2 lg:col-span-2 flex flex-col gap-6">
            <WeeklyChart transactions={transactions} />
            <AiReport transactions={transactions} spendingLimit={spendingLimit} income={income} expenses={expenses} />
          </div>
        </div>
      </main>
    </div>
  );
}
