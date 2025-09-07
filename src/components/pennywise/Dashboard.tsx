
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import NextLink from 'next/link';
import { useRouter } from "next/navigation";
<<<<<<< HEAD
import { PlusCircle, Tags, LogOut, BookUser, MoreVertical, Loader2, Cloud, CloudOff, Repeat } from "lucide-react";
=======
import { PlusCircle, Tags, LogOut, BookUser, MoreVertical, Loader2, Cloud, CloudOff } from "lucide-react";
>>>>>>> 5aec298 (Try fixing this error: `Console Error: Encountered two children with the)
import type { Transaction, Category, Debt } from "@/lib/types";
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
<<<<<<< HEAD
import { getUserData, saveUserData, deleteTransactionAction } from "@/lib/actions";
import { useDebouncedCallback } from "use-debounce";

=======
import {
    getUserData,
    addTransactionAction,
    deleteTransactionAction,
    addCategoryAction,
    deleteCategoryAction,
    setSpendingLimitAction,
} from "@/lib/actions";
>>>>>>> 5aec298 (Try fixing this error: `Console Error: Encountered two children with the)

const fixedCategoriesData: Omit<Category, 'id'>[] = [
    { name: 'Salary', icon: 'Landmark', type: 'income', isFixed: true },
    { name: 'Debt Repayment', icon: 'Repeat', type: 'income', isFixed: true },
    { name: 'Lending', icon: 'BookUser', type: 'expense', isFixed: true },
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
  const [debts, setDebts] = useState<Debt[]>([]);
  const [spendingLimit, setSpendingLimit] = useState<number>(5000000);
  const [debts, setDebts] = useState<Debt[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

<<<<<<< HEAD
  const debouncedSave = useDebouncedCallback(async (email: string, trans: Transaction[], cats: Category[], limit: number, debtList: Debt[]) => {
    setIsSyncing(true);
    const result = await saveUserData(email, trans, cats, limit, debtList);
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


=======
>>>>>>> 5aec298 (Try fixing this error: `Console Error: Encountered two children with the)
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
            setDebts(result.data.debts || []);
            
            const userCategories = result.data.categories || [];
<<<<<<< HEAD
            
            const existingCategoryNames = new Set(userCategories.map(c => `${c.name.toLowerCase()}|${c.type}`));
            const missingFixedCategories = fixedCategoriesData.filter(
                fc => !existingCategoryNames.has(`${fc.name.toLowerCase()}|${fc.type}`)
            );
      
            const finalCategories = [...userCategories, ...missingFixedCategories.map(c => ({...c, id: crypto.randomUUID()}))];
            setCategories(finalCategories);
=======
            const newCategories = [...userCategories];
            
            fixedCategoriesData.forEach(fixedCat => {
                if (!userCategories.some(userCat => userCat.name === fixedCat.name && userCat.type === fixedCat.type)) {
                    const newCategoryToAdd: Category = { ...fixedCat, id: crypto.randomUUID() };
                    newCategories.push(newCategoryToAdd);
                    // Also add it to the sheet for consistency
                    addCategoryAction(userEmail, newCategoryToAdd);
                }
            });
            setCategories(newCategories);
>>>>>>> 5aec298 (Try fixing this error: `Console Error: Encountered two children with the)

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

  const addTransaction = async (transactionData: Omit<Transaction, "id">) => {
    if (!userEmail) return;

<<<<<<< HEAD
<<<<<<< HEAD
 const saveData = useCallback((
    newTransactions: Transaction[] | ((prev: Transaction[]) => Transaction[]),
    newCategories: Category[] | ((prev: Category[]) => Category[]),
    newLimit: number | ((prev: number) => number),
    newDebts: Debt[] | ((prev: Debt[]) => Debt[])
  ) => {
      if (!userEmail) return;
      
      let finalTransactions: Transaction[] = [];
      let finalCategories: Category[] = [];
      let finalLimit: number = 0;
      let finalDebts: Debt[] = [];

      setTransactions(prev => {
          finalTransactions = typeof newTransactions === 'function' ? newTransactions(prev) : newTransactions;
          return finalTransactions;
      });
      setCategories(prev => {
          finalCategories = typeof newCategories === 'function' ? newCategories(prev) : newCategories;
          return finalCategories;
      });
      setSpendingLimit(prev => {
          finalLimit = typeof newLimit === 'function' ? newLimit(prev) : newLimit;
          return finalLimit;
      });
      setDebts(prev => {
          finalDebts = typeof newDebts === 'function' ? newDebts(prev) : newDebts;
          return finalDebts;
      });

      debouncedSave(userEmail, finalTransactions, finalCategories, finalLimit, finalDebts);
  }, [userEmail, debouncedSave]);
  

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const categoryExists = categories.some(c => c.name.toLowerCase() === transaction.category.toLowerCase() && c.type === transaction.type);
    
    let updatedCategories = categories;
=======
=======
    setIsSyncing(true);
>>>>>>> dc8a151 (error saat hapus Debt Repayment)
    const categoryExists = categories.some(c => c.name.toLowerCase() === transactionData.category.toLowerCase() && c.type === transactionData.type);
>>>>>>> 5aec298 (Try fixing this error: `Console Error: Encountered two children with the)
    if (!categoryExists) {
        const catResult = await addCategoryAction(userEmail, { name: transactionData.category, type: transactionData.type });
        if (catResult.success && catResult.category) {
            setCategories(prev => [...prev, catResult.category!]);
        }
    }

<<<<<<< HEAD
    const newTransaction = { ...transaction, id: crypto.randomUUID() };
    const updatedTransactions = [newTransaction, ...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    saveData(updatedTransactions, updatedCategories, spendingLimit, debts);
    setTransactionFormOpen(false);
    
    const randomMessage = najwaCompliments[Math.floor(Math.random() * najwaCompliments.length)];
    toast({
      title: "Success!",
      description: randomMessage,
    });
  };

  const deleteTransaction = async (transactionId: string) => {
      if (!userEmail) return;

      setIsSyncing(true);
      const result = await deleteTransactionAction(userEmail, transactionId);
      setIsSyncing(false);

      if (result.success) {
          setTransactions(result.transactions || []);
          setDebts(result.debts || []);
          toast({
              title: "Transaction Deleted",
              description: "The transaction and any linked debt record have been updated."
          });
      } else {
          toast({
              variant: "destructive",
              title: "Error",
              description: result.error || "Could not delete the transaction."
          });
      }
=======
    const result = await addTransactionAction(userEmail, transactionData);
    setIsSyncing(false);
    if (result.success && result.transaction) {
        setTransactions(prev => [result.transaction!, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setTransactionFormOpen(false);
        const randomMessage = najwaCompliments[Math.floor(Math.random() * najwaCompliments.length)];
        toast({
          title: "Success!",
          description: randomMessage,
        });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const deleteTransaction = async (id: string) => {
    if(!userEmail) return;

    const transactionToDelete = transactions.find(t => t.id === id);
    if (!transactionToDelete) return;

    setIsSyncing(true);
    const result = await deleteTransactionAction(userEmail, transactionToDelete, debts);
    setIsSyncing(false);
    
    if (result.success) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        if (result.deletedDebtId) {
            setDebts(prev => prev.filter(d => d.id !== result.deletedDebtId));
        }
        if (result.updatedDebt) {
            setDebts(prev => prev.map(d => d.id === result.updatedDebt!.id ? result.updatedDebt! : d));
        }
        toast({ title: "Transaction Deleted", description: "The transaction has been successfully removed." });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
>>>>>>> 5aec298 (Try fixing this error: `Console Error: Encountered two children with the)
  };

  const addCategory = async (categoryData: Omit<Category, "id" | 'isFixed' | 'icon'>) => {
    if (!userEmail) return;

    setIsSyncing(true);
    const existingCategory = categories.find(c => c.name.toLowerCase() === categoryData.name.toLowerCase() && c.type === categoryData.type);
    if (existingCategory) {
        toast({ variant: 'destructive', title: 'Category exists', description: `Category "${categoryData.name}" for ${categoryData.type} already exists.` });
        setIsSyncing(false);
        return; 
    }
<<<<<<< HEAD
    const newCategory: Category = { ...category, id: crypto.randomUUID(), icon: 'Tag', isFixed: false };
    const updatedCategories = [...categories, newCategory];
    saveData(transactions, updatedCategories, spendingLimit, debts);
=======
    const result = await addCategoryAction(userEmail, categoryData);
    setIsSyncing(false);
    if (result.success && result.category) {
        setCategories(prev => [...prev, result.category!]);
        toast({ title: 'Success!', description: `Category "${result.category.name}" has been added.` });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
>>>>>>> 5aec298 (Try fixing this error: `Console Error: Encountered two children with the)
  };

  const deleteCategory = async (id: string) => {
    const categoryToDelete = categories.find(c => c.id === id);
    if (!categoryToDelete) return;

    if (categoryToDelete.isFixed) {
        toast({ variant: "destructive", title: "Cannot Delete Category", description: `"${categoryToDelete.name}" is a default category and cannot be deleted.` });
        return;
    }

    const isCategoryInUse = transactions.some(t => t.category.toLowerCase() === categoryToDelete.name.toLowerCase() && t.type === categoryToDelete.type);
    if (isCategoryInUse) {
        toast({ variant: "destructive", title: "Cannot Delete Category", description: `"${categoryToDelete.name}" is in use by one or more transactions.` });
        return;
    }
<<<<<<< HEAD
    const updatedCategories = categories.filter(c => c.id !== id);
    saveData(transactions, updatedCategories, spendingLimit, debts);
    toast({
      title: 'Success!',
      description: `Category "${categoryToDelete.name}" has been deleted.`
    });
  };

  const handleSetSpendingLimit = (newLimit: number) => {
    saveData(transactions, categories, newLimit, debts);
=======
    
    setIsSyncing(true);
    const result = await deleteCategoryAction(id);
    setIsSyncing(false);
    if (result.success) {
        setCategories(prev => prev.filter(c => c.id !== id));
        toast({ title: 'Success!', description: `Category "${categoryToDelete.name}" has been deleted.` });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const handleSetSpendingLimit = async (newLimit: number) => {
    if (!userEmail) return;
    setIsSyncing(true);
    const result = await setSpendingLimitAction(userEmail, newLimit);
    setIsSyncing(false);
    if (result.success) {
        setSpendingLimit(newLimit);
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
>>>>>>> 5aec298 (Try fixing this error: `Console Error: Encountered two children with the)
  };

  const { income, expenses, balance } = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expenses;
    return { income, expenses, balance };
  }, [transactions]);

  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  const incomeCategories = useMemo(() => {
      return categories.filter(c => c.type === 'income').sort((a,b) => a.name.localeCompare(b.name));
  }, [categories]);

  const expenseCategories = useMemo(() => {
    return categories.filter(c => c.type === 'expense').sort((a,b) => a.name.localeCompare(b.name));
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
              {isSyncing || isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (error ? <CloudOff className="h-4 w-4 text-destructive" /> : <Cloud className="h-4 w-4 text-green-500" />) }
              <span className="hidden md:inline">{isSyncing || isLoading ? "Syncing..." : (error ? "Sync Failed" : "Synced")}</span>
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
            <TransactionHistory 
              transactions={transactions} 
              categories={categories}
              onDeleteTransaction={deleteTransaction}
            />
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
<<<<<<< HEAD


    
=======
>>>>>>> 5aec298 (Try fixing this error: `Console Error: Encountered two children with the)
