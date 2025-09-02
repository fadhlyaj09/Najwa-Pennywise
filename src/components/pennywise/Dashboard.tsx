
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
import { useAuth } from "@/hooks/use-auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const initialCategoriesData: Category[] = [
    { id: 'income-1', name: 'Salary', icon: 'Landmark', type: 'income' },
    { id: 'expense-1', name: 'Breakfast', icon: 'Coffee', type: 'expense' },
    { id: 'expense-2', name: 'Lunch', icon: 'Utensils', type: 'expense' },
    { id: 'expense-3', name: 'Dinner', icon: 'UtensilsCrossed', type: 'expense' },
    { id: 'expense-4', name: 'Snacking', icon: 'Cookie', type: 'expense' },
    { id: 'expense-5', name: 'Hangout', icon: 'Users', type: 'expense' },
    { id: 'expense-6', name: 'Monthly Shopping', icon: 'ShoppingBag', type: 'expense' },
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
  const [categories] = useState<Category[]>(initialCategoriesData);
  const [spendingLimit, setSpendingLimit] = useState<number>(5000000);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  const transactionsKey = useMemo(() => userEmail ? `pennywise_transactions_${userEmail}` : null, [userEmail]);
  const limitKey = useMemo(() => userEmail ? `pennywise_limit_${userEmail}` : null, [userEmail]);

  useEffect(() => {
    // This effect now ONLY loads data. It will not clear state on logout.
    if (userEmail && transactionsKey && limitKey) {
      const storedTransactionsJson = localStorage.getItem(transactionsKey);
      const storedLimitJson = localStorage.getItem(limitKey);
      
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
  }, [userEmail, transactionsKey, limitKey]);

  useEffect(() => {
    // This effect ONLY saves data. It has guards to prevent saving on logout.
    if (!isLoaded || !transactionsKey || !limitKey) {
        return; // Do not save if not loaded or keys are null (which happens on logout)
    }
    localStorage.setItem(transactionsKey, JSON.stringify(transactions));
    localStorage.setItem(limitKey, JSON.stringify(spendingLimit));
  }, [transactions, spendingLimit, isLoaded, transactionsKey, limitKey]);

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction = { ...transaction, id: crypto.randomUUID() };
    setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setTransactionFormOpen(false);
    
    const randomMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
    toast({
      title: "Success!",
      description: randomMessage,
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
            <TransactionHistory transactions={transactions} />
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
