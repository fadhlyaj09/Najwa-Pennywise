
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

const fixedCategoriesData: Omit<Category, 'id'>[] = [
    { name: 'Salary', icon: 'Landmark', type: 'income', isFixed: true },
    { name: 'Breakfast', icon: 'Coffee', type: 'expense', isFixed: true },
    { name: 'Lunch', icon: 'Utensils', type: 'expense', isFixed: true },
    { name: 'Dinner', icon: 'UtensilsCrossed', type: 'expense', isFixed: true },
    { name: 'Snacking', icon: 'Cookie', type: 'expense', isFixed: true },
    { name: 'Hangout', icon: 'Users', type: 'expense', isFixed: true },
    { name: 'Monthly Shopping', icon: 'ShoppingBag', type: 'expense', isFixed: true },
];

const successMessages = [
    "Transaksi berhasil, cantik! Hebat banget ngatur keuangannya!",
    "Tercatat! Kamu memang paling bisa diandalkan, cantik.",
    "Luar biasa, cantik! Satu langkah lagi menuju tujuan finansialmu.",
    "Mantap, cantik! Pengeluaran terkontrol, masa depan cerah.",
    "Dicatat, cantik! Setiap rupiah berharga, dan kamu memahaminya.",
    "Keren, cantik! Terus disiplin seperti ini ya.",
    "Catatanmu keren, secantik orangnya!",
    "Sempurna! Kamu jago banget, cantik!",
    "Wow, cantik! Keuanganmu makin teratur saja.",
    "Gadis pintar sepertimu memang jago mengelola uang!",
    "Kamu hebat, cantik! Terus semangat menabungnya ya.",
    "Cantik dan cerdas secara finansial, paket komplit!",
];

export default function Dashboard() {
  const { logout, userEmail } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spendingLimit, setSpendingLimit] = useState<number>(5000000);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  const transactionsKey = useMemo(() => userEmail ? `pennywise_transactions_${userEmail}` : null, [userEmail]);
  const categoriesKey = useMemo(() => userEmail ? `pennywise_categories_${userEmail}` : null, [userEmail]);
  const limitKey = useMemo(() => userEmail ? `pennywise_limit_${userEmail}` : null, [userEmail]);

  // Effect to load data from localStorage
  useEffect(() => {
    if (userEmail && transactionsKey && categoriesKey && limitKey) {
      const storedTransactionsJson = localStorage.getItem(transactionsKey);
      const storedCategoriesJson = localStorage.getItem(categoriesKey);
      const storedLimitJson = localStorage.getItem(limitKey);

      let userCategories: Category[] = [];
      if (storedCategoriesJson) {
          try {
              userCategories = JSON.parse(storedCategoriesJson);
          } catch (e) {
              console.error("Failed to parse categories:", e);
          }
      }

      // Check if fixed categories are present, if not, add them
      const fixedCategoryNames = fixedCategoriesData.map(c => c.name);
      const missingFixedCategories = fixedCategoriesData.filter(fc => !userCategories.some(uc => uc.name === fc.name && uc.type === fc.type));
      
      let finalCategories = [...userCategories];
      if(missingFixedCategories.length > 0) {
          finalCategories = [...userCategories, ...missingFixedCategories.map(c => ({...c, id: crypto.randomUUID()}))];
      }
      
      // If categories were empty initially, set them up
      if (userCategories.length === 0) {
        finalCategories = fixedCategoriesData.map(c => ({ ...c, id: crypto.randomUUID() }));
      }

      setCategories(finalCategories);

      if (storedTransactionsJson) {
        try {
          setTransactions(JSON.parse(storedTransactionsJson));
        } catch (e) { 
          console.error("Failed to parse transactions:", e);
          setTransactions([]);
        }
      } else {
        setTransactions([]);
      }
      
      if (storedLimitJson) {
        try {
            setSpendingLimit(JSON.parse(storedLimitJson));
        } catch (e) { 
            console.error("Failed to parse limit:", e);
            setSpendingLimit(5000000);
        }
      } else {
        setSpendingLimit(5000000);
      }
      
      setIsLoaded(true);
    }
  }, [userEmail, transactionsKey, categoriesKey, limitKey]);

  // Effect to save data to localStorage
  useEffect(() => {
    // This guard is critical to prevent data loss on logout.
    // It only saves when data has been loaded for a specific user.
    if (!isLoaded || !transactionsKey || !categoriesKey || !limitKey) {
        return;
    }
    localStorage.setItem(transactionsKey, JSON.stringify(transactions));
    localStorage.setItem(categoriesKey, JSON.stringify(categories));
    localStorage.setItem(limitKey, JSON.stringify(spendingLimit));
  }, [transactions, categories, spendingLimit, isLoaded, transactionsKey, categoriesKey, limitKey]);

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    // Auto-create category if it doesn't exist
    const categoryExists = categories.some(c => c.name.toLowerCase() === transaction.category.toLowerCase() && c.type === transaction.type);
    if (!categoryExists) {
        addCategory({ name: transaction.category, icon: 'Tag', type: transaction.type, isFixed: false });
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

    // Prevent deleting fixed categories
    if (categoryToDelete.isFixed) {
        toast({
            variant: "destructive",
            title: "Cannot delete category",
            description: `"${categoryToDelete.name}" is a default category and cannot be deleted.`
        });
        return;
    }

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
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-5xl mx-auto flex h-16 items-center justify-between px-4">
          <NextLink href="/" passHref>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text cursor-pointer">
              Najwa Pennywise
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
                <SummaryCards 
                income={income}
                expenses={expenses}
                balance={balance}
                spendingLimit={spendingLimit}
                onSetSpendingLimit={setSpendingLimit}
                />
            </div>
          <div className="col-span-1 md:col-span-1 flex flex-col gap-6">
            <TransactionHistory transactions={transactions} categories={categories} />
          </div>
          <div className="col-span-1 md:col-span-1 flex flex-col gap-6">
            <WeeklyChart transactions={transactions} />
            <AiReport transactions={transactions} spendingLimit={spendingLimit} income={income} expenses={expenses} />
          </div>
        </div>
      </main>
    </div>
  );
}
