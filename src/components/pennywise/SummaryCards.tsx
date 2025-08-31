"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowUpCircle, ArrowDownCircle, Wallet, Edit, Check } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SummaryCardsProps {
  income: number;
  expenses: number;
  balance: number;
  spendingLimit: number;
  onSetSpendingLimit: (limit: number) => void;
}

const SummaryCards = ({ income, expenses, balance, spendingLimit, onSetSpendingLimit }: SummaryCardsProps) => {
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [newLimit, setNewLimit] = useState(spendingLimit);

  const spendingProgress = spendingLimit > 0 ? (expenses / spendingLimit) * 100 : 0;
  const limitExceeded = expenses > spendingLimit;

  const handleLimitSave = () => {
    onSetSpendingLimit(newLimit);
    setIsEditingLimit(false);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <ArrowUpCircle className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${income.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <ArrowDownCircle className="h-5 w-5 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${expenses.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance</CardTitle>
          <Wallet className="h-5 w-5 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${balance >= 0 ? 'text-foreground' : 'text-red-500'}`}>
            ${balance.toFixed(2)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Spending Limit</CardTitle>
             {isEditingLimit ? (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleLimitSave}>
                  <Check className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingLimit(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
          </div>
          {isEditingLimit ? (
            <Input 
              type="number"
              value={newLimit}
              onChange={(e) => setNewLimit(Number(e.target.value))}
              className="mt-1 h-8"
            />
          ) : (
            <div className="text-2xl font-bold">${spendingLimit.toFixed(2)}</div>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
            <Progress value={spendingProgress} className={limitExceeded ? "[&>div]:bg-destructive" : ""} />
            <p className={`text-xs ${limitExceeded ? 'text-destructive' : 'text-muted-foreground'}`}>
                {limitExceeded
                ? `You've exceeded your limit by $${(expenses - spendingLimit).toFixed(2)}`
                : `$${(spendingLimit - expenses).toFixed(2)} remaining`}
            </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCards;
