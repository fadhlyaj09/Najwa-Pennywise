
"use client";

import { useState, useEffect, useMemo } from "react";
import NextLink from 'next/link';
import { PlusCircle, BookUser, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import type { Debt } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import DebtForm from "@/components/pennywise/DebtForm";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function DebtPage() {
  const { logout, isAuthenticated, isLoading, userEmail } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  const debtsKey = useMemo(() => userEmail ? `pennywise_debts_${userEmail}` : null, [userEmail]);

  useEffect(() => {
    if (userEmail && !isLoaded) {
      const storedDebts = localStorage.getItem(debtsKey!);
      if (storedDebts) {
        try {
          setDebts(JSON.parse(storedDebts));
        } catch (e) {
          console.error("Failed to parse debts from localStorage", e);
          setDebts([]);
        }
      } else {
        setDebts([]);
      }
      setIsLoaded(true);
    } else if (!userEmail) {
      setIsLoaded(false);
      setDebts([]);
    }
  }, [userEmail, isLoaded, debtsKey]);

  useEffect(() => {
    if (isLoaded && debtsKey) {
      localStorage.setItem(debtsKey, JSON.stringify(debts));
    }
  }, [debts, isLoaded, debtsKey]);

  const addDebt = (debt: Omit<Debt, 'id' | 'status'>) => {
    const newDebt: Debt = { ...debt, id: crypto.randomUUID(), status: 'unpaid' };
    setDebts(prev => [newDebt, ...prev].sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()));
    setIsFormOpen(false);
    toast({
        title: "Success!",
        description: "Debt record has been added."
    });
  };

  const markAsPaid = (id: string) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, status: 'paid' } : d));
    toast({
        title: "Debt Settled!",
        description: "The debt has been marked as paid."
    });
  };

  const { unpaidDebts, paidDebts, totalUnpaid } = useMemo(() => {
    const unpaid = debts.filter(d => d.status === 'unpaid');
    const paid = debts.filter(d => d.status === 'paid');
    const total = unpaid.reduce((sum, d) => sum + d.amount, 0);
    return { unpaidDebts: unpaid, paidDebts: paid, totalUnpaid: total };
  }, [debts]);
  
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  }

  if (isLoading || !isAuthenticated) {
     return (
      <div className="flex items-center justify-center min-h-screen">
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
            <h1 className="text-xl font-bold tracking-tight text-foreground">Buku Kas - Utang</h1>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <Button>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Tambah Utang
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Catatan Utang Baru</DialogTitle>
                        <DialogDescription>Catat siapa yang berutang kepada Anda.</DialogDescription>
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
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Total Utang Belum Dibayar</CardTitle>
                <CardDescription>Jumlah total uang yang dipinjamkan dan belum kembali.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold text-destructive">{formatRupiah(totalUnpaid)}</p>
            </CardContent>
        </Card>

        <Tabs defaultValue="unpaid">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="unpaid">Belum Lunas ({unpaidDebts.length})</TabsTrigger>
                <TabsTrigger value="paid">Sudah Lunas ({paidDebts.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="unpaid">
                <Card>
                    <CardContent className="p-0">
                       <ScrollArea className="h-[60vh]">
                            <div className="p-6 space-y-4">
                            {unpaidDebts.length === 0 ? (
                                <p className="text-center text-muted-foreground py-10">Tidak ada utang yang belum lunas.</p>
                            ) : (
                                unpaidDebts.map(debt => (
                                    <div key={debt.id} className="p-4 border rounded-lg flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{debt.debtorName}</p>
                                            <p className="text-xl font-bold">{formatRupiah(debt.amount)}</p>
                                            <p className="text-sm text-muted-foreground">{debt.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Jatuh tempo: {format(parseISO(debt.dueDate), "d MMMM yyyy")}</p>
                                        </div>
                                        <Button size="sm" onClick={() => markAsPaid(debt.id)}>Tandai Lunas</Button>
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
                                <p className="text-center text-muted-foreground py-10">Tidak ada utang yang sudah lunas.</p>
                            ) : (
                                paidDebts.map(debt => (
                                    <div key={debt.id} className="p-4 border rounded-lg flex justify-between items-center opacity-60">
                                        <div>
                                            <p className="font-semibold">{debt.debtorName}</p>
                                            <p className="text-xl font-bold">{formatRupiah(debt.amount)}</p>
                                            <p className="text-sm text-muted-foreground">{debt.description}</p>
                                        </div>
                                        <Badge variant="secondary">Lunas</Badge>
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
