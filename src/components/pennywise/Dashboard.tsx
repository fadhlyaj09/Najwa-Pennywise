
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import NextLink from 'next/link';
import { useRouter } from "next/navigation";
import { PlusCircle, Tags, LogOut, BookUser, MoreVertical, Loader2, Cloud, CloudOff, Repeat } from "lucide-react";
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
import { getUserData, saveUserData } from "@/lib/actions";
import { useDebouncedCallback } from "use-debounce";


const fixedCategoriesData: Omit<Category, 'id'>[] = [
    { name: 'Salary', icon: 'Landmark', type: 'income', isFixed: true },
    { name: 'Debt Repayment', icon: 'Repeat', type: 'income', isFixed: true },
    { name: 'Breakfast', icon: 'Coffee', type: 'expense', isFixed: true },
    { name: 'Lunch', icon: 'Utensils', type: 'expense', isFixed: true },
    { name: 'Dinner', icon: 'UtensilsCrossed', type: 'expense', isFixed: true },
    { name: 'Snacking', icon: 'Cookie', type: 'expense', isFixed: true },
    { name: 'Hangout', icon: 'Users', type: 'expense', isFixed: true },
    { name: 'Monthly Shopping', icon: 'ShoppingBag', type: 'expense', isFixed: true },
];

const najwaCompliments = [
    "Asiiik, transaksi masuk! Najwa cantik emang paling jago ngatur duit.",
    "Cakep! Duitnya langsung kecatet. Emang a-class banget Najwa cantik.",
    "Gokil! Keuanganmu makin kece, Najwa cantik. Lanjutkan!",
    "Mantap jiwa, Najwa cantik! Duit aman, hati senang.",
    "Wih, gercep banget! Najwa cantik emang paling top soal cuan.",
    "Keren abis, Najwa cantik! Financial goals makin deket nih.",
];

export default function Dashboard() {
  const { logout, userEmail } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spendingLimit, setSpendingLimit] = useState<number>(5000000);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const debouncedSave = useDebouncedCallback(async (email: string, trans: Transaction[], cats: Category[], limit: number) => {
    setIsSyncing(true);
    const result = await saveUserData(email, trans, cats, limit);
    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: result.error || "Could not save data to the cloud."
      });
      setError(result.error || "Sync failed");
    }
    setIsSyncing(false);
  }, 2000);


  useEffect(() => {
    if (!userEmail) {
        setIsLoading(false);
        return;
    };

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        
        const result = await getUserData(userEmail);
        
        if (result.success && result.data) {
            setTransactions(result.data.transactions || []);
            setSpendingLimit(result.data.spendingLimit || 5000000);
            
            const userCategories = result.data.categories || [];
            const missingFixedCategories = fixedCategoriesData.filter(
                fc => !userCategories.some(uc => uc.name === fc.name && uc.type === fc.type)
            );
      
            const finalCategories = [...userCategories, ...missingFixedCategories.map(c => ({...c, id: crypto.randomUUID()}))];
            setCategories(finalCategories);

        } else {
            setError(result.error || 'Failed to load data.');
             toast({
                variant: "destructive",
                title: "Loading Error",
                description: result.error || "Could not load data from the cloud."
            });
        }
        setIsLoading(false);
    }
    loadData();
  }, [userEmail, toast]);


  const saveData = useCallback((
    newTransactions: Transaction[],
    newCategories: Category[],
    newLimit: number
  ) => {
      if (!userEmail) return;
      setTransactions(newTransactions);
      setCategories(newCategories);
      setSpendingLimit(newLimit);
      debouncedSave(userEmail, newTransactions, newCategories, newLimit);
  }, [userEmail, debouncedSave]);
  

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const categoryExists = categories.some(c => c.name.toLowerCase() === transaction.category.toLowerCase() && c.type === transaction.type);
    
    let updatedCategories = categories;
    if (!categoryExists) {
        const newCategory: Category = { name: transaction.category, type: transaction.type, id: crypto.randomUUID(), icon: 'Tag', isFixed: false };
        updatedCategories = [...categories, newCategory];
    }

    const newTransaction = { ...transaction, id: crypto.randomUUID() };
    const updatedTransactions = [newTransaction, ...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    saveData(updatedTransactions, updatedCategories, spendingLimit);
    setTransactionFormOpen(false);
    
    const randomMessage = najwaCompliments[Math.floor(Math.random() * najwaCompliments.length)];
    toast({
      title: "Success!",
      description: randomMessage,
    });
  };
  
  const addCategory = (category: Omit<Category, "id" | 'isFixed' | 'icon'>) => {
    const existingCategory = categories.find(c => c.name.toLowerCase() === category.name.toLowerCase() && c.type === category.type);
    if (existingCategory) {
        toast({
            variant: 'destructive',
            title: 'Category exists',
            description: `Category "${category.name}" for ${category.type} already exists.`
        });
        return; 
    }
    const newCategory: Category = { ...category, id: crypto.randomUUID(), icon: 'Tag', isFixed: false };
    const updatedCategories = [...categories, newCategory];
    saveData(transactions, updatedCategories, spendingLimit);
  };
  
  const deleteCategory = (id: string) => {
    const categoryToDelete = categories.find(c => c.id === id);
    if (!categoryToDelete) return;

    if (categoryToDelete.isFixed) {
        toast({
            variant: "destructive",
            title: "Cannot Delete Category",
            description: `"${categoryToDelete.name}" is a default category and cannot be deleted.`
        });
        return;
    }

    const isCategoryInUse = transactions.some(t => t.category.toLowerCase() === categoryToDelete.name.toLowerCase() && t.type === categoryToDelete.type);
    
    if (isCategoryInUse) {
        toast({
            variant: "destructive",
            title: "Cannot Delete Category",
            description: `"${categoryToDelete.name}" is in use by one or more transactions.`
        });
        return;
    }
    const updatedCategories = categories.filter(c => c.id !== id);
    saveData(transactions, updatedCategories, spendingLimit);
    toast({
      title: 'Success!',
      description: `Category "${categoryToDelete.name}" has been deleted.`
    });
  };

  const handleSetSpendingLimit = (newLimit: number) => {
    saveData(transactions, categories, newLimit);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }


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
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mr-2">
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : (error ? <CloudOff className="h-4 w-4 text-destructive" /> : <Cloud className="h-4 w-4 text-green-500" />) }
              <span className="hidden md:inline">{isSyncing ? "Syncing..." : (error ? "Sync Failed" : "Synced")}</span>
            </div>

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
      
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6">
        {error && !isLoading && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-4 mb-6 text-sm">
                <p><strong>Loading Error:</strong> {error} Please check your connection or try refreshing the page.</p>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
                <SummaryCards 
                income={income}
                expenses={expenses}
                balance={balance}
                spendingLimit={spendingLimit}
                onSetSpendingLimit={handleSetSpendingLimit}
                />
            </div>
          <div className="col-span-1 md:col-span-1 lg:col-span-2 flex flex-col gap-6">
            <TransactionHistory transactions={transactions} categories={categories} />
          </div>
          <div className="col-span-1 md:col-span-1 lg:col-span-1 flex flex-col gap-6">
            <WeeklyChart transactions={transactions} />
            <AiReport transactions={transactions} spendingLimit={spendingLimit} income={income} expenses={expenses} />
          </div>
        </div>
      </main>
    </div>
  );
}

    