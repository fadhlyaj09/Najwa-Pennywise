
"use client";

import { useState, useEffect, useMemo } from "react";
import NextLink from 'next/link';
import { PlusCircle, LogOut, ArrowLeft, Loader2, Cloud, CloudOff, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import type { Debt, Transaction } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import DebtForm from "@/components/pennywise/DebtForm";
import { useToast } from "@/hooks/use-toast";
import { formatRupiah } from "@/lib/utils";
import { getDebts, settleDebtAction, addDebtAction, deleteDebtAction } from "@/lib/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DebtPage() {
  const { logout, isAuthenticated, isAuthLoading, userEmail } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    if (userEmail) {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            const result = await getDebts(userEmail);

            if (result.success && result.data) {
                setDebts(result.data.sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()));
            } else {
                setError(result.error || 'Failed to load debt data.');
                toast({
                    variant: "destructive",
                    title: "Loading Error",
                    description: result.error || "Could not load debt records from the cloud."
                });
            }
            setIsLoading(false);
        };
        loadData();
    }
  }, [userEmail, isAuthenticated, isAuthLoading, toast]);


<<<<<<< HEAD
  const addDebt = async (debtData: Omit<Debt, 'id' | 'status' | 'lendingTransactionId' | 'repaymentTransactionId'>) => {
=======
  const addDebt = async (debtData: Omit<Debt, 'id' | 'status' | 'icon'>) => {
>>>>>>> 5aec298 (Try fixing this error: `Console Error: Encountered two children with the)
    if (!userEmail) return;

    setIsSyncing(true);
    const result = await addDebtAction(userEmail, debtData);
    setIsSyncing(false);

    if (result.success && result.newDebt) {
        setDebts(prev => [result.newDebt!, ...prev].sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()));
        setIsFormOpen(false);
        toast({
            title: "Success!",
            description: "Debt record and expense transaction have been added."
        });
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "Could not add the debt record."
        });
    }
  };

  const markAsPaid = async (debt: Debt) => {
    if (!userEmail || debt.status === 'paid') return;

    setIsSyncing(true);
    const result = await settleDebtAction(userEmail, debt);
    setIsSyncing(false);

    if (result.success && result.updatedDebt) {
        setDebts(prev => prev.map(d => d.id === result.updatedDebt!.id ? result.updatedDebt! : d));
        toast({
            title: "Debt Settled!",
            description: "The debt has been marked as paid and an income transaction has been created."
        });
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "Could not settle the debt."
        });
    }
  };
  
  const deleteDebt = async (debt: Debt) => {
    if(!userEmail) return;
    setIsSyncing(true);
    const result = await deleteDebtAction(debt);
    setIsSyncing(false);

    if(result.success) {
        setDebts(prev => prev.filter(d => d.id !== debt.id));
        toast({
            title: "Debt Deleted",
            description: "The debt record and its related expense have been removed."
        });
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "Could not delete the debt record."
        });
    }
  }

  const { unpaidDebts, paidDebts, totalUnpaid } = useMemo(() => {
    const unpaid = debts.filter(d => d.status === 'unpaid');
    const paid = debts.filter(d => d.status === 'paid');
    const total = unpaid.reduce((sum, d) => sum + d.amount, 0);
    return { unpaidDebts: unpaid, paidDebts: paid, totalUnpaid: total };
  }, [debts]);
  
  if (isAuthLoading || isLoading) {
     return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
     return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Redirecting to login...</p>
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
     <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
             <NextLink href="/" passHref>
                <Button variant="ghost" size="icon" aria-label="Back to Dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
            </NextLink>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Debt Ledger</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : (error ? <CloudOff className="h-4 w-4 text-destructive" /> : <Cloud className="h-4 w-4 text-green-500" />) }
              <span className="hidden md:inline">{isSyncing ? "Saving..." : (error ? "Sync Failed" : "Synced")}</span>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <Button>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Add Debt
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Debt Record</DialogTitle>
                        <DialogDescription>Track money you've lent out. This will also create an expense transaction.</DialogDescription>
                    </DialogHeader>
                    <DebtForm onAddDebt={addDebt} />
                </DialogContent>
            </Dialog>

            <Button variant="ghost" size="icon" aria-label="Logout" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6">
        {error && !isLoading && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-4 mb-6 text-sm">
                <p><strong>Loading Error:</strong> {error} Please check your connection or try refreshing the page.</p>
            </div>
        )}
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Total Unpaid Debt</CardTitle>
                <CardDescription>The total amount of money that has been lent out and not yet returned.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold text-destructive">{formatRupiah(totalUnpaid)}</p>
            </CardContent>
        </Card>

        <Tabs defaultValue="unpaid">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="unpaid">Unpaid ({unpaidDebts.length})</TabsTrigger>
                <TabsTrigger value="paid">Paid ({paidDebts.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="unpaid">
                <Card>
                    <CardContent className="p-0">
                       <ScrollArea className="h-[60vh]">
                            <div className="p-6 space-y-4">
                            {unpaidDebts.length === 0 ? (
                                <p className="text-center text-muted-foreground py-10">No unpaid debts. Great!</p>
                            ) : (
                                unpaidDebts.map(debt => (
                                    <div key={debt.id} className="p-4 border rounded-lg flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{debt.debtorName}</p>
                                            <p className="text-xl font-bold">{formatRupiah(debt.amount)}</p>
                                            <p className="text-sm text-muted-foreground">{debt.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Due date: {format(parseISO(debt.dueDate), "d MMMM yyyy")}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button size="sm" onClick={() => markAsPaid(debt)} disabled={isSyncing}>
                                                {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Mark as Paid
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" disabled={isSyncing}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the debt record for "{debt.debtorName}" and the associated "Lending" expense transaction. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteDebt(debt)}>
                                                        Continue
                                                    </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))
                            )}
                            </div>
                       </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="paid">
                 <Card>
                    <CardContent className="p-0">
                       <ScrollArea className="h-[60vh]">
                            <div className="p-6 space-y-4">
                            {paidDebts.length === 0 ? (
                                <p className="text-center text-muted-foreground py-10">No paid debts.</p>
                            ) : (
                                paidDebts.map(debt => (
                                    <div key={debt.id} className="p-4 border rounded-lg flex justify-between items-center opacity-60">
                                        <div>
                                            <p className="font-semibold">{debt.debtorName}</p>
                                            <p className="text-xl font-bold">{formatRupiah(debt.amount)}</p>
                                            <p className="text-sm text-muted-foreground">{debt.description}</p>
                                        </div>
                                        <Badge variant="secondary">Paid</Badge>
                                    </div>
                                ))
                            )}
                            </div>
                       </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

