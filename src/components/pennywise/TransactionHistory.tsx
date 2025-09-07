
"use client";

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Transaction, Category } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { type LucideIcon, ShoppingCart, Car, Landmark, Utensils, Coffee, UtensilsCrossed, Cookie, ShoppingBag, Users, Wifi, Tag } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

// A fallback map for icons
const iconMap: { [key: string]: LucideIcon } = {
    'shoppingcart': ShoppingCart, 'car': Car, 'landmark': Landmark, 'utensils': Utensils, 
    'coffee': Coffee, 'utensilscrossed': UtensilsCrossed, 'cookie': Cookie, 
    'shoppingbag': ShoppingBag, 'users': Users, 'wifi': Wifi, 'tag': Tag,
};

const getCategoryIcon = (categoryName: string, categories: Category[]) => {
    const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    const iconName = category?.icon?.toLowerCase() || 'tag';
    const Icon = iconMap[iconName] || Tag;
    return <Icon className="h-5 w-5 mr-3 text-muted-foreground" />;
};


interface TransactionHistoryProps {
  transactions: Transaction[];
  categories: Category[];
}

const TransactionHistory = ({ transactions, categories }: TransactionHistoryProps) => {

  const groupedTransactions = React.useMemo(() => 
    transactions.reduce((acc, t) => {
      const date = format(parseISO(t.date), "MMMM d, yyyy");
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(t);
      return acc;
    }, {} as Record<string, Transaction[]>)
  , [transactions]);

  const sortedDates = Object.keys(groupedTransactions).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px]">
          {transactions.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-lg font-semibold">No transactions yet</p>
                <p className="text-muted-foreground">Add a transaction to get started.</p>
            </div>
          ) : (
            <Accordion type="single" collapsible defaultValue={sortedDates.length > 0 ? sortedDates[0] : undefined}>
              {sortedDates.map((date) => (
                <AccordionItem value={date} key={date}>
                  <AccordionTrigger>{date}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-3">
                      {groupedTransactions[date].map((t) => (
                        <li key={t.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                          <div className="flex items-center">
                            {getCategoryIcon(t.category, categories)}
                            <span className="font-medium">{t.category}</span>
                          </div>
                          <span className={`font-semibold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
